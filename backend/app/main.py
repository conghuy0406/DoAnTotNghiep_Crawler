# --- 1. FIX LỖI WINDOWS PLAYWRIGHT (BẮT BUỘC Ở DÒNG ĐẦU) ---
import sys
import asyncio

if sys.platform == "win32":
    # Thiết lập policy riêng cho Windows để hỗ trợ mở trình duyệt con
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
# -----------------------------------------------------------

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import crawl, auth, source, history
from app.api import crawl, auth, source, history, bookmarks, export 
app = FastAPI()

# --- 2. CẤU HÌNH CORS ---
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
    allow_methods=["*"], 
    allow_headers=["*"],
)

# --- 3. ĐĂNG KÝ ROUTER ---
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"]) 
app.include_router(crawl.router, prefix="/api/v1", tags=["Crawl"])
app.include_router(source.router, prefix="/api/v1/sources", tags=["Source Config"])
app.include_router(history.router)
app.include_router(bookmarks.router)
app.include_router(export.router)
# --- (TẠM ẨN SCHEDULER ĐỂ TEST) ---
# @app.on_event("startup")
# async def startup_event():
#     from app.services.scheduler import start_scheduler
#     start_scheduler()

@app.get("/")
async def root():
    return {"message": "Backend API is Ready (Fixed Windows 100%)!"}