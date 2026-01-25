provider "aws" {
  region = "eu-west-1"
}

# --- SSH Key Pair ---
resource "tls_private_key" "pk" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "kp" {
  key_name   = "cloudio-key"
  public_key = tls_private_key.pk.public_key_openssh
}

resource "local_file" "ssh_key" {
  filename        = "${path.module}/cloudio-key.pem"
  content         = tls_private_key.pk.private_key_pem
  file_permission = "0400"
}

# --- Security Group ---
resource "aws_security_group" "web_sg" {
  name        = "cloudio-sg"
  description = "Allow SSH, HTTP, HTTPS and K8s NodePorts"

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # K8s NodePorts
  ingress {
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound rule
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- EC2 Instance (t3.small) ---
resource "aws_instance" "app_server" {
  ami           = "ami-0694d931cee176e7d" # Ubuntu 24.04 LTS (eu-west-1)
  instance_type = "t3.small"

  key_name               = aws_key_pair.kp.key_name
  vpc_security_group_ids = [aws_security_group.web_sg.id]

  root_block_device {
    volume_size = 20
  }

  tags = {
    Name = "Cloudio-Server"
  }
}

# --- S3 Bucket ---
resource "aws_s3_bucket" "cloudio_storage" {
  bucket_prefix = "cloudio-data-"
  force_destroy = true

  tags = {
    Name = "Cloudio Storage"
  }
}

# --- Outputs ---
output "server_public_ip" {
  value = aws_instance.app_server.public_ip
}

output "ssh_command" {
  value = "ssh -i cloudio-key.pem ubuntu@${aws_instance.app_server.public_ip}"
}
