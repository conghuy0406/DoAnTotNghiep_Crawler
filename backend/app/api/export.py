# FILE: backend/app/api/export.py

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from typing import Optional
import io
import pandas as pd  # Thư viện xử lý dữ liệu mạnh mẽ
from datetime import datetime
from app.core.config import db

router = APIRouter(
    prefix="/api/v1/export",
    tags=["Export Data"]
)

@router.get("/excel")
async def export_history_excel(
    keyword: Optional[str] = Query(None, description="Lọc theo từ khóa"),
    only_bookmarked: bool = Query(False, description="Chỉ xuất những bài đã Bookmark")
):
    """
    Xuất dữ liệu phân tích AI ra file Excel (.xlsx) xịn. Chuẩn 100% tiếng Việt, tự chia cột.
    """
    # 1. Xây dựng bộ lọc
    query = {}
    if keyword:
        query["keyword"] = {"$regex": keyword, "$options": "i"}
    if only_bookmarked:
        query["is_bookmarked"] = True

    # 2. Lấy dữ liệu từ DB
    cursor = db.universal_knowledge.find(query).sort("created_at", -1)
    records = await cursor.to_list(length=None)

    # 3. Chuẩn bị mảng dữ liệu (Danh sách các Dictionary)
    data_list = []
    for row in records:
        # Gom các điểm nhấn
        highlights = row.get("key_highlights", [])
        highlights_str = "\n".join(f"- {h}" for h in highlights) if highlights else ""

        # Gom dữ liệu cấu trúc
        structured_data = row.get("structured_data", [])
        structured_str = " | ".join(f"{item.get('label')}: {item.get('value')}" for item in structured_data) if structured_data else ""

        # Format ngày tháng
        created_at = row.get("created_at")
        try:
            date_str = created_at.strftime("%d/%m/%Y %H:%M:%S") if created_at else ""
        except:
            date_str = str(created_at)

        # Thêm 1 dòng vào danh sách
        data_list.append({
            "ID": str(row.get("_id")),
            "Từ khóa": row.get("keyword", ""),
            "Thể loại": row.get("category", ""),
            "Sắc thái": row.get("sentiment", ""),
            "Tóm tắt AI": row.get("summary", ""),
            "Điểm nhấn": highlights_str,
            "Dữ liệu chi tiết": structured_str,
            "Ngày tạo": date_str
        })

    # 4. Chuyển dữ liệu vào Pandas DataFrame (Bảng)
    df = pd.DataFrame(data_list)

    # 5. Ghi dữ liệu ra file Excel trong Bộ nhớ tạm (RAM) để xuất luôn không cần lưu file rác vào ổ cứng
    stream = io.BytesIO()
    with pd.ExcelWriter(stream, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Báo cáo AI')
        
        # (Tùy chọn nâng cao) Tự động chỉnh độ rộng cột cho đẹp
        worksheet = writer.sheets['Báo cáo AI']
        for idx, col in enumerate(df.columns):
            worksheet.column_dimensions[chr(65 + idx)].width = 20 # Độ rộng cột khoảng 20 ký tự
    
    # Đưa con trỏ đọc về đầu file
    stream.seek(0)

    # 6. Tạo tên file và trả về cho người dùng tải
    filename = f"Bao_cao_AI_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", # Định dạng chuẩn của Excel
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )