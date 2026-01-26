from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import crawl

app = FastAPI()


origins = [
    "http://localhost",
    "http://localhost:3000", 
    "http://localhost:5173", 
    "*"                      
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Cho phép tất cả các method: GET, POST, DELETE...
    allow_headers=["*"],
)

# Đăng ký Router
app.include_router(crawl.router, prefix="/api/v1", tags=["Crawl"])

@app.get("/")
async def root():
    return {"message": "Backend API is Ready & CORS Enabled!"}