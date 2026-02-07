import redis
import time
import json
import re
from pymongo import MongoClient
from playwright.sync_api import sync_playwright
from app.services.ai.analysis import analyze_sentiment

# --- CẤU HÌNH ---
MONGO_URL = "mongodb://localhost:27017"
REDIS_HOST = 'localhost'
REDIS_PORT = 6379

client = MongoClient(MONGO_URL)
db = client.crawler_db
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

# --- HÀM LÀM SẠCH DỮ LIỆU (Có thể tách ra file riêng nếu muốn) ---
def clean_text(text):
    if not text: return ""
    text = re.sub(r'\s+', ' ', text).strip() # Xóa khoảng trắng thừa
    return text

def run_crawler(url, keyword=None, selectors=None):
    print(f"🌍 Đang crawl: {url}")
    
    # Nếu không có selector (crawl lẻ), dùng bộ mặc định dự phòng
    if not selectors:
        selectors = {"detail_title": "h1", "detail_content": "body"}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False) 
        page = browser.new_page()
        
        try:
            page.goto(url, timeout=60000)
            
            # --- 1. LẤY TIÊU ĐỀ (ĐỘNG) ---
            user_title_sel = selectors.get("detail_title", "h1")
            
            title = ""
            if page.locator(user_title_sel).count() > 0:
                title = page.locator(user_title_sel).first.inner_text()
            else:
                title = page.title() # Dự phòng
                
            # --- 2. LẤY NỘI DUNG (ĐỘNG) ---
            user_content_sel = selectors.get("detail_content", "body")
            
            # Kỹ thuật: Ưu tiên lấy thẻ p bên trong thẻ chứa nội dung
            final_content_sel = f"{user_content_sel} p" 
            
            content = ""
            if page.locator(final_content_sel).count() > 0:
                # Lấy tất cả đoạn văn
                paragraphs = page.locator(final_content_sel).all_inner_texts()
                content = "\n".join(paragraphs)
            elif page.locator(user_content_sel).count() > 0:
                # Fallback: Lấy toàn bộ text
                content = page.locator(user_content_sel).first.inner_text()

            # --- 3. LÀM SẠCH DỮ LIỆU ---
            title = clean_text(title)
            content = clean_text(content)
            summary = content[:200] + "..." # Tự tạo summary từ content

            # --- 4. KIỂM TRA ĐỘ LIÊN QUAN (NẾU CÓ KEYWORD) ---
            relevance_score = 100
            if keyword:
                count = content.lower().count(keyword.lower())
                if count < 1: relevance_score = 10  # Rất thấp
                elif count < 3: relevance_score = 50 # Trung bình
                else: relevance_score = 90 + (count * 2) # Cao
                if relevance_score > 100: relevance_score = 100

            # --- 5. GỌI AI PHÂN TÍCH ---
            print("   -> 🧠 Đang nhờ AI đọc bài báo...")
            sentiment_label, sentiment_score = analyze_sentiment(content)
            
            browser.close()
            
            return {
                "title": title,
                "summary": summary,
                "content": content,
                "sentiment": sentiment_label,
                "sentiment_score": sentiment_score,
                "relevance_score": relevance_score,
                "crawled_at": time.time()
            }
            
        except Exception as e:
            print(f"   ❌ Lỗi crawler: {e}")
            browser.close()
            return None

def start_worker():
    print("👷 Worker Dynamic đang chạy... Đang chờ việc từ Redis...")
    while True:
        try:
            task = redis_client.brpop("crawl_queue")
            if task:
                raw_data = task[1]
                
                # Parse JSON từ Redis
                try:
                    job_data = json.loads(raw_data)
                    url = job_data.get("url")
                    keyword = job_data.get("keyword")
                    selectors = job_data.get("selectors") # Lấy công thức
                except:
                    # Hỗ trợ format cũ (chỉ có URL string)
                    url = raw_data
                    keyword = None
                    selectors = None
                
                crawl_data = run_crawler(url, keyword, selectors)
                
                if crawl_data:
                    db.jobs.update_one(
                        {"url": url, "status": "Pending"},
                        {"$set": {"status": "Completed", "result": crawl_data}}
                    )
                    print("✅ Đã lưu kết quả!")
                else:
                    db.jobs.update_one(
                        {"url": url, "status": "Pending"},
                        {"$set": {"status": "Failed"}}
                    )
        except Exception as e:
            print(f"🔥 Lỗi worker: {e}")
            time.sleep(1)

if __name__ == "__main__":
    start_worker()