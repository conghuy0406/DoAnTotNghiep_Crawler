from fastapi import APIRouter, HTTPException
from app.schemas.job_schema import JobCreate 
from app.core.config import db, redis_client
import uuid
from datetime import datetime
from bson import ObjectId # Thư viện để xử lý ID của MongoDB

router = APIRouter()

# 1. API Gửi lệnh Crawl (POST)
@router.post("/crawl")
async def create_crawl_job(job_data: JobCreate):
    job_id = str(uuid.uuid4())
    new_job = {
        "_id": job_id,
        "url": job_data.url,
        "status": "Pending",
        "created_at": datetime.utcnow()
    }
    await db.jobs.insert_one(new_job)
    redis_client.lpush("crawl_queue", job_data.url)
    return {"message": "Đã nhận job!", "job_id": job_id, "status": "Pending"}

# 2. API Lấy danh sách Job (GET List)
@router.get("/jobs")
async def get_recent_jobs():
    cursor = db.jobs.find().sort("created_at", -1).limit(20)
    jobs = await cursor.to_list(length=20)
    for job in jobs:
        job["_id"] = str(job["_id"])
        if "created_at" in job:
            job["created_at"] = job["created_at"].isoformat()
    return jobs

# 3. API Xem chi tiết Job (GET Detail) - MỚI
@router.get("/jobs/{job_id}")
async def get_job_detail(job_id: str):
    # Tìm kiếm theo _id (Lưu ý: _id của mình đang lưu là String UUID)
    job = await db.jobs.find_one({"_id": job_id})
    
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy Job này")
    
    # Format dữ liệu trả về
    job["_id"] = str(job["_id"])
    if "created_at" in job:
        job["created_at"] = job["created_at"].isoformat()
        
    return job

# 4. API Xóa Job (DELETE) - MỚI
@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    result = await db.jobs.delete_one({"_id": job_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Không tìm thấy Job để xóa")
        
    return {"message": "Đã xóa thành công!"}