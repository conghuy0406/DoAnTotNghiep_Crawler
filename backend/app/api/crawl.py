from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime
from bson import ObjectId

from app.core.config import db
from app.services.searcher import search_by_config, crawl_single_url
from app.api.auth import get_current_user

router = APIRouter()

class CrawlRequest(BaseModel):
    keyword: str
    limit: int = 5
    target_sources: Optional[List[str]] = []

class CrawlLinkRequest(BaseModel):
    url: str

async def run_crawler_job(task_id: str, keyword: str, limit: int, sources: list, user_id: str):
    try:
        await db.tasks.update_one(
            {"_id": task_id},
            {"$set": {"status": "running", "progress": 5, "message": "Đang khởi động...", "started_at": datetime.now()}}
        )

        # Gọi hàm cào dữ liệu
        result = await search_by_config(keyword=keyword, selected_sources=sources, limit=limit, task_id=task_id)
        
        # 🌟 KIỂM TRA MÓM DỮ LIỆU Ở ĐÂY
        if not result or not result.get("analysis"):
            # Cập nhật trạng thái hoàn thành nhưng báo là KHÔNG CÓ DỮ LIỆU
            await db.tasks.update_one(
                {"_id": task_id},
                {"$set": {
                    "status": "completed", 
                    "progress": 100, 
                    "message": "Không tìm thấy bài viết hợp lệ!", 
                    "result_id": None, 
                    "finished_at": datetime.now()
                }}
            )
            return # Dừng hàm luôn, không chạy xuống dưới nữa

        # Nếu có dữ liệu thì làm tiếp bình thường
        ai_report_id = str(result.get("analysis", {}).get("_id", ""))

        # 🔒 QUAN TRỌNG: Gắn user_id vào kết quả Báo cáo AI vừa thu thập xong
        if ai_report_id and ObjectId.is_valid(ai_report_id):
            await db.universal_knowledge.update_one(
                {"_id": ObjectId(ai_report_id)},
                {"$set": {"user_id": user_id}}
            )

        await db.tasks.update_one(
            {"_id": task_id},
            {"$set": {
                "status": "completed", 
                "progress": 100, 
                "message": "Hoàn thành xuất sắc!", 
                "result_id": ai_report_id, 
                "finished_at": datetime.now()
            }}
        )
    except Exception as e:
        await db.tasks.update_one(
            {"_id": task_id}, 
            {"$set": {"status": "failed", "progress": 0, "message": f"Lỗi hệ thống: {str(e)}", "finished_at": datetime.now()}}
        )
@router.post("/keyword")
async def crawl_by_keyword(payload: CrawlRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    task_id = str(uuid.uuid4())
    user_id = current_user["id"]
    
    # 🔒 LƯU TASK CỦA AI VÀO DB
    task_doc = {
        "_id": task_id, "user_id": user_id, "keyword": payload.keyword,
        "status": "pending", "progress": 0, "message": "Đang đưa vào hàng đợi...", "created_at": datetime.now()
    }
    await db.tasks.insert_one(task_doc)

    background_tasks.add_task(run_crawler_job, task_id=task_id, keyword=payload.keyword, limit=payload.limit, sources=payload.target_sources, user_id=user_id)
    return {"message": "Hệ thống đang tiến hành thu thập ngầm.", "task_id": task_id}

@router.get("/status/{task_id}")
async def get_task_status(task_id: str, current_user: dict = Depends(get_current_user)):
    # 🔒 CHỈ CHO XEM TRẠNG THÁI TASK CỦA CHÍNH MÌNH
    task = await db.tasks.find_one({"_id": task_id, "user_id": current_user["id"]})
    if not task: raise HTTPException(status_code=404, detail="Không tìm thấy tiến trình này.")
    return task

@router.post("/url")
async def crawl_by_url(payload: CrawlLinkRequest, current_user: dict = Depends(get_current_user)):
    try:
        url = payload.url.strip()
        if not url: raise HTTPException(status_code=400, detail="URL không được để trống")
        result = await run_in_threadpool(crawl_single_url, url)
        if result.get("status") == "failed": return {"message": "Lỗi khi đọc bài", "data": result}
        return {"message": "Đọc bài viết thành công!", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))