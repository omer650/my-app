import os
import psycopg2
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "password")

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS
    )

# מודלים
class Category(BaseModel):
    name: str

class CategoryResponse(Category):
    id: int

class FileItem(BaseModel):
    title: str
    description: str  # שונה מ-author לתיאור כללי יותר
    source_url: str
    category_id: int  # מקושר לקטגוריה לפי ID
    media_type: str   # video / pdf / image / other

class FileItemResponse(FileItem):
    id: int
    category_name: str # כדי להציג את השם בצד לקוח

@app.on_event("startup")
def startup_event():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # 1. יצירת טבלת קטגוריות
        cur.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE
            );
        """)

        # 2. יצירת טבלת קבצים (Content)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS files (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description VARCHAR(255),
                source_url TEXT,
                category_id INT REFERENCES categories(id) ON DELETE SET NULL,
                media_type VARCHAR(50)
            );
        """)
        
        # הכנסת קטגוריות ברירת מחדל אם אין כלום
        cur.execute("SELECT COUNT(*) FROM categories;")
        if cur.fetchone()[0] == 0:
            cur.execute("INSERT INTO categories (name) VALUES ('כללי'), ('עבודה'), ('מסמכים אישיים');")

        conn.commit()
        cur.close()
        conn.close()
        print("Database initialized for Cloudio.")
    except Exception as e:
        print(f"Error initializing database: {e}")

# --- API קטגוריות ---

@app.get("/categories", response_model=List[CategoryResponse])
def get_categories():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM categories ORDER BY id ASC;")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"id": r[0], "name": r[1]} for r in rows]

@app.post("/categories")
def add_category(cat: Category):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO categories (name) VALUES (%s) RETURNING id;", (cat.name,))
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {"id": new_id, "name": cat.name}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/categories/{cat_id}")
def delete_category(cat_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM categories WHERE id = %s;", (cat_id,))
    conn.commit()
    conn.close()
    return {"message": "Category deleted"}

# --- API קבצים ---

@app.get("/files", response_model=List[FileItemResponse])
def get_files():
    conn = get_db_connection()
    cur = conn.cursor()
    # שליפה חכמה שמביאה גם את שם הקטגוריה (JOIN)
    query = """
        SELECT f.id, f.title, f.description, f.source_url, f.media_type, c.id, c.name 
        FROM files f 
        LEFT JOIN categories c ON f.category_id = c.id
        ORDER BY f.id DESC;
    """
    cur.execute(query)
    rows = cur.fetchall()
    conn.close()
    
    files = []
    for r in rows:
        files.append({
            "id": r[0], "title": r[1], "description": r[2], 
            "source_url": r[3], "media_type": r[4],
            "category_id": r[5] if r[5] else 0,
            "category_name": r[6] if r[6] else "ללא קטגוריה"
        })
    return files

@app.post("/files")
def create_file(item: FileItem):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO files (title, description, source_url, category_id, media_type) VALUES (%s, %s, %s, %s, %s) RETURNING id;",
        (item.title, item.description, item.source_url, item.category_id, item.media_type)
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    conn.close()
    return {"id": new_id, "message": "File added"}

@app.delete("/files/{file_id}")
def delete_file(file_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM files WHERE id = %s;", (file_id,))
    conn.commit()
    conn.close()
    return {"message": "Deleted successfully"}