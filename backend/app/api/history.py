# FILE: backend/app/api/history.py

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from bson import ObjectId
from app.core.config import db  # Import kết nối MongoDB của bạn

# Tạo một Router riêng cho các API liên quan đến Lịch sử & Thống kê
router = APIRouter(
    prefix="/api/v1/history",
    tags=["History & Dashboard"]
)

# ==========================================
# 1. API LẤY DANH SÁCH (Dành cho Bảng dữ liệu)
# ==========================================
@router.get("/")
async def get_history_list(
    page: int = Query(1, ge=1, description="Trang hiện tại"),
    limit: int = Query(10, ge=1, le=100, description="Số lượng kết quả mỗi trang"),
    keyword: Optional[str] = Query(None, description="Tìm kiếm theo từ khóa")
):
    """
    Lấy danh sách các báo cáo AI đã phân tích. Có hỗ trợ phân trang và tìm kiếm.
    """
    skip = (page - 1) * limit
    query = {}
    
    # Nếu người dùng nhập chữ vào ô tìm kiếm
    if keyword:
        query["keyword"] = {"$regex": keyword, "$options": "i"} # Tìm kiếm không phân biệt hoa thường

    # Lấy dữ liệu từ collection 'universal_knowledge', sắp xếp mới nhất lên đầu
    cursor = db.universal_knowledge.find(query).sort("created_at", -1).skip(skip).limit(limit)
    records = await cursor.to_list(length=limit)
    
    # Đếm tổng số lượng để Frontend làm nút Bấm chuyển trang (1, 2, 3...)
    total_records = await db.universal_knowledge.count_documents(query)

    # Convert ObjectId của MongoDB thành String để không bị lỗi JSON
    for record in records:
        record["_id"] = str(record["_id"])

    return {
        "total": total_records,
        "page": page,
        "limit": limit,
        "data": records
    }

# ==========================================
# 2. API LẤY CHI TIẾT 1 BÁO CÁO
# ==========================================
@router.get("/{record_id}")
async def get_history_detail(record_id: str):
    """
    Xem chi tiết toàn bộ bài phân tích AI của 1 lần crawl cụ thể.
    """
    # Kiểm tra xem ID có hợp lệ chuẩn MongoDB không
    if not ObjectId.is_valid(record_id):
        raise HTTPException(status_code=400, detail="ID không hợp lệ")

    record = await db.universal_knowledge.find_one({"_id": ObjectId(record_id)})
    
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy báo cáo này")

    record["_id"] = str(record["_id"])
    return record

# ==========================================
# 3. API LẤY THỐNG KÊ (Dành cho Vẽ Biểu Đồ Dashboard)
# ==========================================
@router.get("/stats/dashboard")
async def get_dashboard_stats():
    """
    Đếm tổng số liệu để Frontend vẽ biểu đồ Tròn, biểu đồ Cột.
    """
    # Đếm tổng số lần đã crawl
    total_crawls = await db.universal_knowledge.count_documents({})
    
    # Dùng Aggregation Pipeline của MongoDB để đếm xem có bao nhiêu Tích cực/Tiêu cực
    # Giống như lệnh GROUP BY trong SQL
    sentiment_pipeline = [
        {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}}
    ]
    sentiment_cursor = db.universal_knowledge.aggregate(sentiment_pipeline)
    sentiment_data = await sentiment_cursor.to_list(length=None)
    
    # Format lại data cho đẹp: {"Tích cực": 5, "Tiêu cực": 2, "Trung lập": 10}
    sentiment_distribution = {item["_id"]: item["count"] for item in sentiment_data}

    return {
        "total_crawls": total_crawls,
        "sentiment_distribution": sentiment_distribution
    }