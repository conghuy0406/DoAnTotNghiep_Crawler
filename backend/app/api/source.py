from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.config import db
from typing import Dict
import uuid

router = APIRouter()

# Schema dữ liệu cho một nguồn tin
class SourceConfig(BaseModel):
    name: str              # Tên báo (VD: Kenh14)
    base_url: str          # VD: https://kenh14.vn
    search_url_template: str # VD: https://kenh14.vn/tim-kiem.chn?keywords={keyword}
    
    # Bộ chọn CSS (Người dùng tự điền vào)
    selectors: Dict[str, str] = {
        "post_item": "h3.knswli-title", # Thẻ bao ngoài bài viết khi tìm kiếm
        "title_link": "a",              # Link bài viết
        "detail_title": "h1.kbwc-title",# (MỚI) Selector lấy Tiêu đề chi tiết
        "detail_content": ".knc-content" # (MỚI) Selector lấy Nội dung chi tiết
    }

@router.post("/")
async def create_source(source: SourceConfig):
    """Người dùng thêm nguồn báo mới"""
    new_source = source.dict()
    new_source["_id"] = str(uuid.uuid4())
    
    await db.websites.insert_one(new_source)
    return {"message": "Đã thêm nguồn mới thành công!", "id": new_source["_id"]}

@router.get("/")
async def get_sources():
    """Lấy danh sách các nguồn đang có"""
    sources = await db.websites.find().to_list(length=100)
    return sources

@router.delete("/{source_id}")
async def delete_source(source_id: str):
    await db.websites.delete_one({"_id": source_id})
    return {"message": "Đã xóa nguồn."}