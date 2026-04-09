from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from bson import ObjectId
from app.core.config import db
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/v1/history", tags=["History & Dashboard"])

@router.get("/")
async def get_history_list(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    keyword: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    skip = (page - 1) * limit
    # 🔒 GẮN ID ĐỂ TÌM ĐÚNG LỊCH SỬ CỦA MÌNH
    query = {"user_id": current_user["id"]}
    if keyword: query["keyword"] = {"$regex": keyword, "$options": "i"}

    cursor = db.universal_knowledge.find(query).sort("created_at", -1).skip(skip).limit(limit)
    records = await cursor.to_list(length=limit)
    total_records = await db.universal_knowledge.count_documents(query)

    for record in records: record["_id"] = str(record["_id"])
    return {"total": total_records, "page": page, "limit": limit, "data": records}

@router.get("/{record_id}")
async def get_history_detail(record_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(record_id): raise HTTPException(status_code=400, detail="ID lỗi")
    
    # 🔒 CHẶN XEM BÁO CÁO CỦA THẰNG KHÁC
    record = await db.universal_knowledge.find_one({"_id": ObjectId(record_id), "user_id": current_user["id"]})
    if not record: raise HTTPException(status_code=404, detail="Không tìm thấy báo cáo")
    record["_id"] = str(record["_id"])
    return record

@router.get("/stats/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    # 🔒 ĐẾM TỔNG THEO USER ID
    total_crawls = await db.universal_knowledge.count_documents({"user_id": user_id})
    
    # 🔒 GOM NHÓM THEO USER ID
    sentiment_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}}
    ]
    sentiment_cursor = db.universal_knowledge.aggregate(sentiment_pipeline)
    sentiment_data = await sentiment_cursor.to_list(length=None)
    sentiment_distribution = {item["_id"]: item["count"] for item in sentiment_data}

    return {"total_crawls": total_crawls, "sentiment_distribution": sentiment_distribution}