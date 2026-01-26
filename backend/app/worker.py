import redis
import time
from pymongo import MongoClient
from playwright.sync_api import sync_playwright

# --- IMPORT MODULE AI MỚI ---
from app.services.ai.analysis import analyze_sentiment

# --- CẤU HÌNH ---
MONGO_URL = "mongodb://localhost:27017"
REDIS_HOST = 'localhost'
REDIS_PORT = 6379

client = MongoClient(MONGO_URL)
db = client.crawler_db
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

def run_crawler(url):
    print(f"Đang bắt đầu crawl: {url}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True) 
        page = browser.new_page()
        
        try:
            page.goto(url, timeout=60000)
            print("   -> Đã truy cập trang web...")
            
            # 1. Lấy Tiêu đề
            if page.locator("h1.title-detail").count() > 0:
                title = page.locator("h1.title-detail").first.inner_text()
            else:
                title = page.title()
                
            # 2. Lấy Tóm tắt
            summary = ""
            if page.locator("p.description").count() > 0:
                summary = page.locator("p.description").first.inner_text()
                
            # 3. Lấy Nội dung
            content_paragraphs = page.locator("article.fck_detail p.Normal").all_inner_texts()
            content = "\n".join(content_paragraphs)
            
            # --- PHẦN MỚI: GỌI AI PHÂN TÍCH ---
            print("   ->Đang nhờ AI đọc bài báo...")
            sentiment_label, sentiment_score = analyze_sentiment(content)
            print(f"   ->Kết quả AI: {sentiment_label} (Độ tin cậy: {sentiment_score:.2f})")
            
            browser.close()
            

            return {
                "title": title,
                "summary": summary,
                "content": content,
                "sentiment": sentiment_label,      
                "sentiment_score": sentiment_score, 
                "crawled_at": time.time()
            }
            
        except Exception as e:
            print(f"Lỗi crawler: {e}")
            browser.close()
            return None

def start_worker():
    print("👷 Worker AI đang chạy... Đang chờ việc...")
    while True:
        try:
            task = redis_client.brpop("crawl_queue")
            if task:
                url_to_crawl = task[1]
                crawl_data = run_crawler(url_to_crawl)
                
                if crawl_data:
                    db.jobs.update_one(
                        {"url": url_to_crawl, "status": "Pending"},
                        {"$set": {"status": "Completed", "result": crawl_data}}
                    )
                    print("Xong! Đã lưu kết quả kèm phân tích AI.")
                else:
                    db.jobs.update_one(
                        {"url": url_to_crawl, "status": "Pending"},
                        {"$set": {"status": "Failed"}}
                    )
        except Exception as e:
            print(f"Lỗi worker: {e}")
            time.sleep(1)

if __name__ == "__main__":
    start_worker()