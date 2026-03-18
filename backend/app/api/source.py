from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.core.config import db
from typing import Dict, Optional
import uuid
from datetime import datetime

router = APIRouter()

class SourceConfig(BaseModel):
    name: str              
    base_url: str         
    search_url_template: str 
    
    is_active: bool = True 
    
    selectors: Dict[str, str] = {
        "post_item": "h3.knswli-title", 
        "title_link": "a",              
        "detail_title": "h1.kbwc-title",
        "detail_content": ".knc-content" 
    }

# (MỚI) Schema dành riêng cho việc Cập nhật (Sửa)
class SourceConfigUpdate(BaseModel):
    name: Optional[str] = None
    base_url: Optional[str] = None
    search_url_template: Optional[str] = None
    is_active: Optional[bool] = None
    selectors: Optional[Dict[str, str]] = None



@router.post("/")
async def create_source(source: SourceConfig):
    """Người dùng thêm nguồn báo mới"""
    new_source = source.dict()
    new_source["_id"] = str(uuid.uuid4())
    new_source["created_at"] = datetime.now()
    new_source["updated_at"] = datetime.now()
    
    await db.websites.insert_one(new_source)
    return {"message": "Đã thêm nguồn mới thành công!", "id": new_source["_id"]}

@router.get("/")
async def get_sources(active_only: bool = False):
    """Lấy danh sách các nguồn (Có thể lọc chỉ lấy nguồn đang Bật)"""
    query = {"is_active": True} if active_only else {}
    sources = await db.websites.find(query).to_list(length=100)
    return sources

@router.get("/{source_id}")
async def get_source_detail(source_id: str):
    source = await db.websites.find_one({"_id": source_id})
    if not source:
        raise HTTPException(status_code=404, detail="Không tìm thấy nguồn báo này")
    return source

# (MỚI) Cập nhật nguồn (PUT)
@router.put("/{source_id}")
async def update_source(source_id: str, source_update: SourceConfigUpdate):

    update_data = {k: v for k, v in source_update.dict(exclude_unset=True).items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Không có dữ liệu để cập nhật")
        
    update_data["updated_at"] = datetime.now()

    result = await db.websites.update_one(
        {"_id": source_id},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Không tìm thấy nguồn báo này")

    return {"message": "Đã cập nhật cấu hình thành công!"}

@router.delete("/{source_id}")
async def delete_source(source_id: str):
    result = await db.websites.delete_one({"_id": source_id})
    if result.deleted_count == 0:
         raise HTTPException(status_code=404, detail="Không tìm thấy nguồn báo này")
    return {"message": "Đã xóa nguồn thành công."}