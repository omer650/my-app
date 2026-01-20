# Stage 1: Build
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
# העתקת התוצרים של ה-Build
COPY --from=build /app/build /usr/share/nginx/html
# --- השורה החדשה שהוספנו: ---
# העתקת קובץ הקונפיגורציה שלנו במקום ברירת המחדל של Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]