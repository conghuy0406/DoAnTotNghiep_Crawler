from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json
import asyncio
from app.core.config import GOOGLE_API_KEY
from google import genai

client = genai.Client(api_key=GOOGLE_API_KEY)
router = APIRouter()

class AIAnalysisPayload(BaseModel):
    url: str
    data: list

@router.post("/api/v1/ai/analyze-crawl")
async def analyze_crawled_data(payload: AIAnalysisPayload):
    if not payload.data:
        raise HTTPException(status_code=400, detail="Không có dữ liệu để phân tích")
    
    # Giảm dữ liệu xuống để tránh lỗi Input Token (vì hạn mức của bạn rất thấp)
    sample_data = payload.data[:10] 
    prompt = f"Phân tích dữ liệu JSON từ {payload.url} và báo cáo bằng Markdown: {json.dumps(sample_data, ensure_ascii=False)}"

    # 🌟 DANH SÁCH MODEL ĐỜI MỚI (Dựa trên ảnh của bạn)
    # Thứ tự: Ưu tiên bản 2.0 (nếu được mở) -> bản 2.5 (đang có hạn mức 20 lượt)
    models_to_try = [
        'gemini-2.0-flash',       # Bản ổn định thế hệ 2
        'gemini-2.0-flash-lite',  # Bản nhẹ, tiết kiệm tài nguyên
        'gemini-2.5-flash',       # Bản bạn đang có 20 lượt/ngày
        'gemini-2.5-pro'          # Bản cực thông minh (nếu Project cho phép)
    ]
    
    last_error_msg = ""

    for model_name in models_to_try:
        try:
            print(f"🤖 Thử nghiệm với model: {model_name}")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            return {
                "status": "success", 
                "model_used": model_name, 
                "analysis": response.text
            }

        except Exception as e:
            last_error_msg = str(e)
            
            # Lỗi 404: Model chưa được mở cho vùng/project của bạn
            # Lỗi 429: Hết hạn mức (như bạn vừa bị hết 20 lượt)
            if "404" in last_error_msg or "429" in last_error_msg:
                print(f"⏩ Model {model_name} lỗi ({last_error_msg[:20]}...), thử model tiếp theo...")
                continue
            
            # Lỗi 503: Server bận, đợi 5s rồi thử lại chính model đó
            if "503" in last_error_msg:
                await asyncio.sleep(5)
                try:
                    response = client.models.generate_content(model=model_name, contents=prompt)
                    return {"status": "success", "model_used": model_name, "analysis": response.text}
                except: continue

    # Nếu tất cả đều thất bại
    if "429" in last_error_msg:
        raise HTTPException(
            status_code=429, 
            detail="Tất cả các model đời mới đều đã hết hạn mức (Quota Exhausted). Hãy đổi API Key mới!"
        )
    
    raise HTTPException(status_code=500, detail=f"Lỗi AI: {last_error_msg}")