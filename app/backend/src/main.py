from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# --- הוספת הגדרות CORS ---
# זה מאפשר ל-Frontend (פורט 3000) לדבר עם ה-Backend (פורט 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # בפרודקשן נחליף את הכוכבית בכתובת האמיתית
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchQuery(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"message": "Torat Emet Backend is Running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/search")
def search(query: SearchQuery):
    print(f"Received search query: {query.text}") 
    return {
        "results": [
            {"text": "תוצאה לדוגמה 1: " + query.text, "source": "מקור א"},
            {"text": "תוצאה לדוגמה 2: שלום עולם", "source": "מקור ב"}
        ]
    }