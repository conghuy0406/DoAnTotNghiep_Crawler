from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from bson import ObjectId
from app.core.config import db
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/v1/history", tags=["History"])




@router.get("/")
async def get_history_list(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    keyword: Optional[str] = Query(None),
    scope: Optional[str] = Query("me"), # 🌟 THÊM THAM SỐ SCOPE
    current_user: dict = Depends(get_current_user)
):
    skip = (page - 1) * limit
    user_role = current_user.get("role", "user")

    # 🌟 LOGIC PHÂN QUYỀN MỚI
    if scope == "all" and user_role == "admin":
        query = {} # Lấy toàn bộ Database
    else:
        query = {"user_id": current_user["id"]} # Chỉ lấy của chính mình

    if keyword: 
        query["keyword"] = {"$regex": keyword, "$options": "i"}

    cursor = db.universal_knowledge.find(query).sort("created_at", -1).skip(skip).limit(limit)
    records = await cursor.to_list(length=limit)
    total_records = await db.universal_knowledge.count_documents(query)

    for record in records: 
        record["_id"] = str(record["_id"])
        
    return {"total": total_records, "page": page, "limit": limit, "data": records}


@router.get("/stats/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_role = current_user.get("role", "user")
    user_id = current_user["id"]
    
    # 🌟 PHÂN QUYỀN TÍNH TOÁN THỐNG KÊ (DASHBOARD)
    match_query = {} if user_role == "admin" else {"user_id": user_id}

    # Đếm tổng số phiên cào dựa theo quyền
    total_crawls = await db.universal_knowledge.count_documents(match_query)
    
    # Gom nhóm Sentiment (Cảm xúc) dựa theo quyền
    sentiment_pipeline = [
        {"$match": match_query},
        {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}}
    ]
    sentiment_cursor = db.universal_knowledge.aggregate(sentiment_pipeline)
    sentiment_data = await sentiment_cursor.to_list(length=None)
    sentiment_distribution = {item["_id"]: item["count"] for item in sentiment_data}

    return {"total_crawls": total_crawls, "sentiment_distribution": sentiment_distribution}


@router.get("/{record_id}")
async def get_history_detail(record_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(record_id): 
        raise HTTPException(status_code=400, detail="ID lỗi")
    
    user_role = current_user.get("role", "user")
    
    # 🌟 PHÂN QUYỀN XEM CHI TIẾT
    if user_role == "admin":
        # Admin được quyền ấn vào xem chi tiết bài của bất kỳ ai
        query = {"_id": ObjectId(record_id)}
    else:
        # User thường chỉ được xem chi tiết bài do chính họ tạo
        query = {"_id": ObjectId(record_id), "user_id": current_user["id"]}

    record = await db.universal_knowledge.find_one(query)
    
    if not record: 
        raise HTTPException(status_code=404, detail="Không tìm thấy báo cáo hoặc bạn không có quyền xem!")
        
    record["_id"] = str(record["_id"])
    return record