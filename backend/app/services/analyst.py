import json
import time  # 🌟 Bắt buộc phải import time để dùng tính năng chờ (sleep)
from google import genai
from app.core.config import GOOGLE_API_KEY

# ==========================================
# 1. KHỞI TẠO CLIENT (THEO CHUẨN MỚI)
# ==========================================
try:
    client = genai.Client(api_key=GOOGLE_API_KEY)
except Exception as e:
    print(f"⚠️ Lỗi khởi tạo Google GenAI Client: {e}")
    client = None

# ==========================================
# 2. HÀM PHÂN TÍCH ĐA NĂNG (CÓ TỰ ĐỘNG THỬ LẠI)
# ==========================================
def analyze_content_universal(articles, keyword):
    """
    Phân tích nội dung với bộ lọc thông minh sử dụng SDK google-genai mới nhất.
    Đã tích hợp cơ chế tự động Thử lại (Retry) khi Google Server quá tải.
    """
    if not articles or not client:
        if not client: print(" Chưa khởi tạo được AI Client.")
        return None

    print(f"      🧠 [AI Analyst] Đang phân tích độ liên quan của {len(articles)} bài báo...")

    # Gom nội dung bài báo
    combined_text = ""
    for i, art in enumerate(articles):
        source = art.get('source_name', 'Unknown')
        title = art.get('title', 'No Title')
        content = art.get('crawled_content', '')[:2000].replace('\n', ' ')
        combined_text += f"\n--- BÀI {i+1} | Nguồn: {source} | Tiêu đề: {title} ---\nNội dung: {content}\n"

    # PROMPT
    prompt = f"""
    Bạn là Biên tập viên tin tức cấp cao. Người dùng tìm kiếm: "{keyword}".

    Dữ liệu thô:
    {combined_text}

    NHIỆM VỤ:
    1. XÁC ĐỊNH NGỮ CẢNH: 
       - Nếu từ khóa là "Đội tuyển Việt Nam", ưu tiên Bóng đá. Loại bỏ Game/Esport trừ khi được hỏi cụ thể.
       - Loại bỏ tin rác/quảng cáo.
    2. TỔNG HỢP: Tóm tắt nội dung chính xác.

    OUTPUT JSON (Không Markdown):
    {{
        "is_relevant": true, 
        "category": "Chủ đề chính",
        "excluded_topics": ["Chủ đề bị loại"],
        "summary": "Tóm tắt (3-5 câu).",
        "sentiment": "Tích cực/Tiêu cực/Trung lập",
        "key_highlights": ["Điểm nhấn 1", "Điểm nhấn 2"],
        "structured_data": [ {{ "label": "...", "value": "..." }} ]
    }}
    """

    MAX_RETRIES = 3
    for attempt in range(MAX_RETRIES):
        try:
            # GỌI API GEMINI (CÚ PHÁP MỚI)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            
            raw_text = response.text.strip()
            
            # Làm sạch JSON
            cleaned_json = raw_text
            if "```json" in raw_text:
                cleaned_json = raw_text.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_text:
                cleaned_json = raw_text.strip("```")

            result_json = json.loads(cleaned_json)
            
            # Fallback values
            defaults = {
                "is_relevant": False,
                "category": "Uncategorized",
                "excluded_topics": [],
                "summary": "Không có thông tin phù hợp.",
                "sentiment": "Neutral",
                "key_highlights": [],
                "structured_data": []
            }
            for k, v in defaults.items():
                if k not in result_json: result_json[k] = v
            
            return result_json # NẾU THÀNH CÔNG THÌ TRẢ VỀ NGAY VÀ LUÔN

        except Exception as e:
            error_msg = str(e)
            print(f"      ❌ Lỗi AI (Lần {attempt + 1}/{MAX_RETRIES}): {error_msg}")
            
            # Nếu là lỗi do Server Google (503) hoặc Quá giới hạn (429) -> Thử lại
            if "503" in error_msg or "UNAVAILABLE" in error_msg or "429" in error_msg:
                if attempt < MAX_RETRIES - 1:
                    wait_time = 2 ** attempt # Lần 1 đợi 1s, Lần 2 đợi 2s
                    print(f"      ⚠️ Gemini API đang bận. Đợi {wait_time}s rồi hỏi lại...")
                    time.sleep(wait_time)
                else:
                    print("      ❌ Đã thử lại nhiều lần nhưng Google vẫn sập.")
            else:
                # Nếu là lỗi khác (Lỗi cấu hình, JSON parse lỗi) thì dừng luôn không cần thử lại
                break

    # NẾU CHẠY HẾT VÒNG LẶP MÀ VẪN THẤT BẠI THÌ TRẢ VỀ LỖI ĐỂ HỆ THỐNG KHÔNG BỊ CRASH
    return {
        "is_relevant": False,
        "category": "Error",
        "summary": "Hệ thống AI của Google đang tạm thời quá tải (Lỗi 503). Vui lòng thử lại sau.",
        "key_highlights": [],
        "structured_data": []
    }