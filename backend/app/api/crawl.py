# FILE: backend/app/api/crawl.py

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

# Import DB và các hàm xử lý
from app.core.config import db
from app.services.searcher import search_by_config, crawl_single_url

router = APIRouter()

# ==========================================
# SCHEMA DỮ LIỆU ĐẦU VÀO
# ==========================================
class CrawlRequest(BaseModel):
    keyword: str
    limit: int = 5
    target_sources: Optional[List[str]] = []

class CrawlLinkRequest(BaseModel):
    url: str

# ==========================================
# 1. HÀM WORKER CHẠY NGẦM (BACKGROUND)
# ==========================================
async def run_crawler_job(task_id: str, keyword: str, limit: int, sources: list):
    """
    Hàm này chạy âm thầm phía sau, cập nhật % tiến trình vào MongoDB.
    """
    try:
        # Cập nhật trạng thái bắt đầu (5%)
        await db.tasks.update_one(
            {"_id": task_id},
            {"$set": {
                "status": "running",
                "progress": 5,
                "message": "Đang khởi động trình duyệt...",
                "started_at": datetime.now()
            }}
        )

        # Gọi hàm cào (Truyền task_id vào để file searcher.py biết đường cập nhật %)
        result = await search_by_config(
            keyword=keyword,
            selected_sources=sources,
            limit=limit,
            task_id=task_id 
        )

        # Lấy ID của báo cáo AI
        ai_report_id = str(result.get("analysis", {}).get("_id", "")) if result and result.get("analysis") else None

        # Cập nhật trạng thái Hoàn thành (100%)
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
        print(f"❌ Lỗi Task ngầm: {e}")
        await db.tasks.update_one(
            {"_id": task_id},
            {"$set": {
                "status": "failed",
                "progress": 0,
                "message": f"Lỗi hệ thống: {str(e)}",
                "finished_at": datetime.now()
            }}
        )

# ==========================================
# 2. API: CRAWL THEO TỪ KHÓA (BẤT ĐỒNG BỘ)
# ==========================================
@router.post("/keyword")
async def crawl_by_keyword(payload: CrawlRequest, background_tasks: BackgroundTasks):
    """
    Kích hoạt cào tin tức. Trả về Task ID ngay lập tức (Không bị treo API).
    """
    task_id = str(uuid.uuid4())

    # Lưu hồ sơ tiến trình vào DB
    task_doc = {
        "_id": task_id,
        "keyword": payload.keyword,
        "status": "pending",
        "progress": 0,
        "message": "Đang đưa vào hàng đợi...",
        "created_at": datetime.now()
    }
    await db.tasks.insert_one(task_doc)

    # Ném việc cho FastAPI xử lý ngầm
    background_tasks.add_task(
        run_crawler_job,
        task_id=task_id,
        keyword=payload.keyword,
        limit=payload.limit,
        sources=payload.target_sources
    )

    return {
        "message": "Hệ thống đang tiến hành thu thập ngầm.",
        "task_id": task_id
    }

# ==========================================
# 3. API: KIỂM TRA TRẠNG THÁI (POLLING CHO FRONTEND)
# ==========================================
@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    """
    Frontend gọi API này 2s/lần để vẽ thanh Progress Bar (0% -> 100%).
    """
    task = await db.tasks.find_one({"_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Không tìm thấy tiến trình này.")
    return task

# ==========================================
# 4. API: CRAWL THEO URL (GIỮ NGUYÊN CỦA BẠN)
# ==========================================
@router.post("/url")
async def crawl_by_url(payload: CrawlLinkRequest):
    """
    Nhận vào 1 link bài báo bất kỳ -> Trả về nội dung chi tiết.
    """
    try:
        url = payload.url.strip()
        if not url:
            raise HTTPException(status_code=400, detail="URL không được để trống")

        print(f"📡 API URL: '{url}'")

        # Chạy hàm crawl trong threadpool
        result = await run_in_threadpool(crawl_single_url, url)

        if result.get("status") == "failed":
            return {"message": "Lỗi khi đọc bài viết", "data": result}

        return {
            "message": "Đọc bài viết thành công!",
            "data": result
        }

    except Exception as e:
        print(f"❌ API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))