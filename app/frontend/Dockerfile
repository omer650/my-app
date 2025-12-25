FROM node:18-alpine

WORKDIR /app

COPY package.json .

# הגדרות לרשת איטית - מגדיל את הזמן לפני שההתקנה נכשלת
RUN npm config set fetch-retries 5
RUN npm config set fetch-retry-mintimeout 20000
RUN npm config set fetch-retry-maxtimeout 120000

# התקנת הספריות
RUN npm install

COPY public/ ./public
COPY src/ ./src

EXPOSE 3000

CMD ["npm", "start"]