from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from bson import ObjectId
from datetime import datetime
from app.core.config import db
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/v1/bookmarks", tags=["Bookmarks"])

@router.post("/{report_id}")
async def add_bookmark(report_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(report_id): raise HTTPException(status_code=400, detail="ID lỗi")
    
    # 🔒 CHẮC CHẮN ĐÂY LÀ BÁO CÁO CỦA MÌNH MỚI CHO LƯU
    report = await db.universal_knowledge.find_one({"_id": ObjectId(report_id), "user_id": current_user["id"]})
    if not report: raise HTTPException(status_code=404, detail="Không tìm thấy báo cáo")

    await db.universal_knowledge.update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {"is_bookmarked": True, "bookmarked_at": datetime.now()}}
    )
    return {"message": "Đã ghim thành công!"}

@router.delete("/{report_id}")
async def remove_bookmark(report_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(report_id): raise HTTPException(status_code=400, detail="ID lỗi")
    
    # 🔒 BỎ GHIM CŨNG PHẢI CHECK QUYỀN
    await db.universal_knowledge.update_one(
        {"_id": ObjectId(report_id), "user_id": current_user["id"]},
        {"$set": {"is_bookmarked": False}, "$unset": {"bookmarked_at": ""}}
    )
    return {"message": "Đã bỏ ghim!"}

@router.get("/")
async def get_bookmarked_list(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    skip = (page - 1) * limit
    # 🔒 CHỈ HIỆN BOOKMARK CỦA CÁ NHÂN
    query = {"is_bookmarked": True, "user_id": current_user["id"]}

    cursor = db.universal_knowledge.find(query).sort("bookmarked_at", -1).skip(skip).limit(limit)
    records = await cursor.to_list(length=limit)
    total_records = await db.universal_knowledge.count_documents(query)

    for record in records: record["_id"] = str(record["_id"])
    return {"total": total_records, "page": page, "limit": limit, "data": records}