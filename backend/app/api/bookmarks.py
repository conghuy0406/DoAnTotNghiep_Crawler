# FILE: backend/app/api/bookmarks.py

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from bson import ObjectId
from datetime import datetime
from app.core.config import db

router = APIRouter(
    prefix="/api/v1/bookmarks",
    tags=["Bookmarks"]
)

# ==========================================
# 1. API: THÊM VÀO BOOKMARK (ĐÁNH DẤU SAO)
# ==========================================
@router.post("/{report_id}")
async def add_bookmark(report_id: str):
    """
    Thêm một báo cáo AI vào danh sách Bookmark (Ghim).
    """
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=400, detail="ID báo cáo không hợp lệ định dạng.")

    # Kiểm tra xem báo cáo có tồn tại không
    report = await db.universal_knowledge.find_one({"_id": ObjectId(report_id)})
    if not report:
        raise HTTPException(status_code=404, detail="Không tìm thấy báo cáo này trong hệ thống.")

    # Cập nhật cờ is_bookmarked = True và lưu thời gian đánh dấu
    await db.universal_knowledge.update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {
            "is_bookmarked": True, 
            "bookmarked_at": datetime.now()
        }}
    )

    return {"message": "Đã thêm báo cáo vào Bookmark thành công!", "report_id": report_id}

# ==========================================
# 2. API: XÓA KHỎI BOOKMARK (BỎ ĐÁNH DẤU)
# ==========================================
@router.delete("/{report_id}")
async def remove_bookmark(report_id: str):
    """
    Xóa báo cáo khỏi danh sách Bookmark.
    """
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=400, detail="ID báo cáo không hợp lệ.")

    # Set is_bookmarked = False và xóa trường bookmarked_at đi cho sạch DB ($unset)
    await db.universal_knowledge.update_one(
        {"_id": ObjectId(report_id)},
        {
            "$set": {"is_bookmarked": False}, 
            "$unset": {"bookmarked_at": ""}
        }
    )

    return {"message": "Đã bỏ ghim báo cáo này!"}

# ==========================================
# 3. API: LẤY DANH SÁCH ĐÃ BOOKMARK
# ==========================================
@router.get("/")
async def get_bookmarked_list(
    page: int = Query(1, ge=1, description="Trang hiện tại"),
    limit: int = Query(10, ge=1, le=100, description="Số lượng mỗi trang")
):
    """
    Lấy danh sách các báo cáo ĐÃ ĐƯỢC BOOKMARK (Sắp xếp theo thời gian đánh dấu mới nhất).
    """
    skip = (page - 1) * limit
    
    # Chỉ query những bản ghi có cờ is_bookmarked == True
    query = {"is_bookmarked": True}

    # Sắp xếp theo thời gian được bookmark (mới nhất lên đầu)
    cursor = db.universal_knowledge.find(query).sort("bookmarked_at", -1).skip(skip).limit(limit)
    records = await cursor.to_list(length=limit)
    
    total_records = await db.universal_knowledge.count_documents(query)

    for record in records:
        record["_id"] = str(record["_id"])

    return {
        "total": total_records,
        "page": page,
        "limit": limit,
        "data": records
    }