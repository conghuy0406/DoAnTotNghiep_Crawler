import google.generativeai as genai
import json
import re

# --- CẤU HÌNH API KEY ---
GENAI_API_KEY = "AIzaSyDF-iX628nHPnWNMlnlRH2ByPZpKGZKkdA" # <--- ĐẢM BẢO KEY CỦA BẠN ĐÃ ĐÚNG
genai.configure(api_key=GENAI_API_KEY)

def extract_gold_data(articles):
    if not articles:
        return {"data": [], "conclusion": "Không có dữ liệu đầu vào."}

    print(f"      🧠 [AI Extractor] Đang xử lý {len(articles)} bài báo...")

    input_text = ""
    for idx, art in enumerate(articles):
        # Lấy tối đa 1500 ký tự để AI có đủ thông tin viết kết luận
        clean_content = art.get('crawled_content', '')[:1500].replace('\n', ' ')
        input_text += f"""
        --- BÀI BÁO SỐ {idx + 1} ---
        Nguồn: {art.get('source_name')}
        Tiêu đề: {art.get('title')}
        Nội dung: {clean_content}
        """

    prompt = f"""
    Bạn là chuyên gia phân tích tài chính. Hãy đọc các bài báo sau và thực hiện 2 nhiệm vụ:

    DỮ LIỆU ĐẦU VÀO:
    {input_text}

    NHIỆM VỤ:
    1. Trích xuất dữ liệu giá vàng (như cũ).
    2. Viết một đoạn "Nhận định thị trường" (Conclusion) khoảng 3-4 câu, tổng hợp nguyên nhân tăng/giảm và tâm lý thị trường.

    YÊU CẦU OUTPUT (Bắt buộc trả về đúng định dạng JSON này):
    {{
      "data": [
        {{ "source": "Tên nguồn", "gold_type": "SJC", "price": 76.5, "trend": "Tăng" }},
        ...
      ],
      "conclusion": "Giá vàng hôm nay biến động mạnh do căng thẳng địa chính trị... Các chuyên gia khuyên..."
    }}
    """

    try:
        # Dùng model xịn nhất bạn có
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        response = model.generate_content(prompt)
        raw_result = response.text.strip()
        cleaned_json = raw_result.replace("```json", "").replace("```", "").strip()
        
        parsed_result = json.loads(cleaned_json)
        
        # Đảm bảo kết quả trả về luôn có đủ 2 trường (phòng khi AI trả thiếu)
        if "data" not in parsed_result: parsed_result["data"] = []
        if "conclusion" not in parsed_result: parsed_result["conclusion"] = "AI không đưa ra được nhận định."
        
        return parsed_result

    except Exception as e:
        print(f"      ❌ Lỗi trích xuất AI: {e}")
        return {"data": [], "conclusion": "Lỗi hệ thống phân tích."}

def calculate_average(extracted_data_list):
    """
    Hàm này chỉ nhận vào cái list 'data' bên trong kết quả của AI
    """
    if not extracted_data_list: return None
    
    total = 0
    count = 0
    min_p = 1000
    max_p = 0
    
    for item in extracted_data_list:
        try:
            p = float(item.get('price', 0))
        except:
            continue
            
        if p > 0:
            total += p
            count += 1
            if p < min_p: min_p = p
            if p > max_p: max_p = p
            
    if count == 0: return None

    return {
        "average_price": round(total / count, 2),
        "min_price": min_p,
        "max_price": max_p,
        "data_points": count,
        "details": extracted_data_list
    }