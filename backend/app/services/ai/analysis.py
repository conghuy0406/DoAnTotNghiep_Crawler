from transformers import pipeline

# Tải mô hình AI phân tích cảm xúc (Chạy lần đầu sẽ tự tải về máy)
# Model này hỗ trợ đa ngôn ngữ, bao gồm tiếng Việt
print("⏳ Đang khởi tạo AI Model...")
sentiment_pipeline = pipeline("sentiment-analysis", model="lxyuan/distilbert-base-multilingual-cased-sentiments-student")

def analyze_sentiment(text):
    """
    Hàm này nhận vào nội dung bài báo -> Trả về Tích cực/Tiêu cực
    """
    try:
        # AI chỉ đọc được khoảng 512 ký tự, nên ta cắt ngắn bài báo để phân tích cho nhanh
        short_text = text[:512]
        
        # Gọi AI phán đoán
        result = sentiment_pipeline(short_text)
        # Kết quả trả về dạng: [{'label': 'positive', 'score': 0.9}]
        
        label = result[0]['label']
        score = result[0]['score']
        
        # Dịch sang tiếng Việt
        if label == "positive":
            vn_label = "Tích cực"
        elif label == "negative":
            vn_label = "Tiêu cực"
        else:
            vn_label = "Trung tính"
            
        return vn_label, score

    except Exception as e:
        print(f"❌ Lỗi AI: {e}")
        return "Không xác định", 0.0