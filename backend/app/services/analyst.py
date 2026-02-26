import json
from google import genai  # Import thư viện mới
from app.core.config import GOOGLE_API_KEY

# ==========================================
# 1. KHỞI TẠO CLIENT (THEO CHUẨN MỚI)
# ==========================================
# Thay vì genai.GenerativeModel, giờ ta dùng genai.Client
try:
    client = genai.Client(api_key=GOOGLE_API_KEY)
except Exception as e:
    print(f"⚠️ Lỗi khởi tạo Google GenAI Client: {e}")
    client = None

# ==========================================
# 2. HÀM PHÂN TÍCH ĐA NĂNG
# ==========================================
def analyze_content_universal(articles, keyword):
    """
    Phân tích nội dung với bộ lọc thông minh sử dụng SDK google-genai mới nhất.
    """
    if not articles or not client:
        if not client: print("❌ Chưa khởi tạo được AI Client.")
        return None

    print(f"      🧠 [AI Analyst] Đang phân tích độ liên quan của {len(articles)} bài báo...")

    # Gom nội dung bài báo
    combined_text = ""
    for i, art in enumerate(articles):
        source = art.get('source_name', 'Unknown')
        title = art.get('title', 'No Title')
        # Lấy 2000 ký tự đầu
        content = art.get('crawled_content', '')[:2000].replace('\n', ' ')
        combined_text += f"\n--- BÀI {i+1} | Nguồn: {source} | Tiêu đề: {title} ---\nNội dung: {content}\n"

    # ==================================================================
    # PROMPT
    # ==================================================================
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

    try:
        # --- CÚ PHÁP MỚI CỦA THƯ VIỆN GOOGLE-GENAI ---
        response = client.models.generate_content(
            model='gemini-2.5-flash', # Hoặc 'gemini-1.5-flash'
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
        
        return result_json

    except Exception as e:
        print(f"      ❌ Lỗi AI Analyst: {e}")
        return {
            "is_relevant": False,
            "category": "Error",
            "summary": "Hệ thống gặp lỗi khi phân tích dữ liệu.",
            "key_highlights": [],
            "structured_data": []
        }