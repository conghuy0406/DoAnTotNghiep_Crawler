from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
# Import hàm xử lý chính
from app.services.searcher import search_by_config

router = APIRouter()

# Định nghĩa Model dữ liệu đầu vào (Input Schema)
class CrawlRequest(BaseModel):
    keyword: str
    limit: int = 5
    target_sources: Optional[List[str]] = []

@router.post("/keyword")
async def crawl_by_keyword(payload: CrawlRequest):
    """
    API tìm kiếm tin tức, crawl chi tiết và dùng AI phân tích.
    """
    try:
        print(f"📡 API Received: Keyword='{payload.keyword}', Sources={payload.target_sources}")

        # Gọi hàm xử lý logic (Searcher + Worker + AI Analyst)
        # Hàm này giờ trả về Dict: { "market_summary": ..., "raw_articles": ... }
        result_data = await search_by_config(
            keyword=payload.keyword,
            selected_sources=payload.target_sources,
            limit=payload.limit
        )

        # Trả kết quả về Frontend
        if not result_data:
            return {
                "message": "Không tìm thấy dữ liệu nào.",
                "data": None
            }

        return {
            "message": "Thu thập và phân tích thành công!",
            # Trả về toàn bộ cấu trúc chứa cả AI Summary và bài viết gốc
            "data": result_data 
        }

    except Exception as e:
        print(f"❌ API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))