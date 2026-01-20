from fastapi import FastAPI # pyright: ignore[reportMissingImports]
from motor.motor_asyncio import AsyncIOMotorClient
import redis
import datetime

app = FastAPI()

# 1. KẾT NỐI MONGODB (Database)
# Lưu ý: Kết nối vào localhost:27017 vì ta chạy code Python ở ngoài container
MONGO_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client.crawler_db # Tự tạo database tên 'crawler_db'

# 2. KẾT NỐI REDIS (Hàng đợi)
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

@app.get("/")
async def root():
    return {"message": "Hệ thống đã sẵn sàng!"}

@app.post("/api/v1/demo-crawl")
async def demo_crawl_flow(url: str):


    job_id = f"job_{datetime.datetime.now().timestamp()}"
    redis_client.lpush("crawl_queue", url) # Đẩy vào danh sách tên 'crawl_queue'
    
    # Bước B: Giả lập lưu dữ liệu vào MongoDB
    dummy_data = {
        "url": url,
        "title": "Demo Crawl Data",
        "status": "Pending",
        "created_at": datetime.datetime.now()
    }
    await db.crawl_results.insert_one(dummy_data)

    return {
        "status": "Thành công",
        "step_1": "Đã nhận URL",
        "step_2": f"Đã đẩy vào Redis Queue (Độ dài hàng đợi: {redis_client.llen('crawl_queue')})",
        "step_3": "Đã lưu bản ghi vào MongoDB"
    }