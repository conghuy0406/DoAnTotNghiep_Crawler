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
    from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from typing import List, Optional

# Import hàm xử lý chính
from app.services.searcher import search_by_config, crawl_single_url

router = APIRouter()

# --- MODEL 1: CRAWL THEO TỪ KHÓA ---
class CrawlRequest(BaseModel):
    keyword: str
    limit: int = 5
    target_sources: Optional[List[str]] = []

# --- MODEL 2: CRAWL THEO LINK CỤ THỂ ---
class CrawlLinkRequest(BaseModel):
    url: str

# API 1: TÌM KIẾM VÀ PHÂN TÍCH (KEYWORD)
@router.post("/keyword")
async def crawl_by_keyword(payload: CrawlRequest):
    """
    Tìm kiếm tin tức trên các báo, crawl chi tiết và dùng AI phân tích.
    """
    try:
        print(f"📡 API Keyword: '{payload.keyword}'")

        # Gọi hàm xử lý logic (Searcher + Worker + AI Analyst)
        result_data = await search_by_config(
            keyword=payload.keyword,
            selected_sources=payload.target_sources,
            limit=payload.limit
        )

        if not result_data:
            return {"message": "Không tìm thấy dữ liệu nào.", "data": None}

        return {
            "message": "Thu thập và phân tích thành công!",
            "data": result_data 
        }

    except Exception as e:
        print(f"❌ API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# API 2: CRAWL LINK CỤ THỂ (URL)
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

        # Chạy hàm crawl trong threadpool để không chặn server
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