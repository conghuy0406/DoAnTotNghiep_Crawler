from fastapi import APIRouter, Query, Depends
from fastapi.responses import StreamingResponse
from typing import Optional
import io
import pandas as pd  
from datetime import datetime
from app.core.config import db
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/v1/export", tags=["Export Data"])

@router.get("/excel")
async def export_history_excel(
    keyword: Optional[str] = Query(None),
    only_bookmarked: bool = Query(False),
    current_user: dict = Depends(get_current_user)
):
    # 🔒 LỌC DATA THEO CHỦ SỞ HỮU TRƯỚC KHI XUẤT EXCEL
    query = {"user_id": current_user["id"]}
    if keyword: query["keyword"] = {"$regex": keyword, "$options": "i"}
    if only_bookmarked: query["is_bookmarked"] = True

    cursor = db.universal_knowledge.find(query).sort("created_at", -1)
    records = await cursor.to_list(length=None)

    data_list = []
    for row in records:
        highlights = row.get("key_highlights", [])
        highlights_str = "\n".join(f"- {h}" for h in highlights) if highlights else ""

        structured_data = row.get("structured_data", [])
        structured_str = " | ".join(f"{item.get('label')}: {item.get('value')}" for item in structured_data) if structured_data else ""

        created_at = row.get("created_at")
        try: date_str = created_at.strftime("%d/%m/%Y %H:%M:%S") if created_at else ""
        except: date_str = str(created_at)

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

    df = pd.DataFrame(data_list)
    stream = io.BytesIO()
    with pd.ExcelWriter(stream, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Báo cáo AI')
        worksheet = writer.sheets['Báo cáo AI']
        for idx, col in enumerate(df.columns):
            worksheet.column_dimensions[chr(65 + idx)].width = 20
            
    stream.seek(0)
    filename = f"Bao_cao_AI_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )