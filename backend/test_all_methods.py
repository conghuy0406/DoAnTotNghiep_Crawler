import requests
import json

# Thay port 8000 bằng port server của bạn nếu cần
API_ENDPOINT = "http://localhost:8000/api/v1/crawl-test/execute-universal"

TEST_CASES = [
    {
        "test_name": "1️⃣ TEST HTML PARSING (VNExpress)",
        "payload": {
            "method": "HTML",
            "url_template": "https://timkiem.vnexpress.net/?q={query}",
            "keyword": "trí tuệ nhân tạo",
            "post_item_sel": "article.item-news",
            "title_sel": "h3.title-news a",
            "regex_pattern": ""
        }
    },
    {
        "test_name": "2️⃣ TEST SELENIUM / PLAYWRIGHT (Dân Trí)",
        "payload": {
            "method": "SELENIUM",
            "url_template": "https://dantri.com.vn/tim-kiem/{query}.htm",
            "keyword": "trí tuệ nhân tạo",
            "post_item_sel": "article.article-item",
            "title_sel": "h3.article-title a",
            "regex_pattern": ""
        }
    },
{
        "test_name": "3️⃣ TEST API REQUEST (Hacker News Tìm kiếm API)",
        "payload": {
            "method": "API",
            # Đây là một API công khai thật 100%, trả về JSON bài viết
            "url_template": "https://hn.algolia.com/api/v1/search?query={query}",
            "keyword": "Artificial Intelligence", # Đổi từ khóa sang tiếng Anh để test
            "post_item_sel": "",
            "title_sel": "",
            "regex_pattern": ""
        }
    },
    {
        "test_name": "4️⃣ TEST REGEX (VNExpress)",
        "payload": {
            "method": "REGEX",
            "url_template": "https://timkiem.vnexpress.net/?q={query}",
            "keyword": "trí tuệ nhân tạo",
            "post_item_sel": "",
            "title_sel": "",
            "regex_pattern": "href=\"(https://vnexpress\\.net/[^\"]+\\.html)\"\\s+title=\"([^\"]+)\""
        }
    }
]

def run_tests():
    print("🚀 BẮT ĐẦU CHẠY KỊCH BẢN KIỂM THỬ TỰ ĐỘNG...")
    print("=" * 60)
    
    for case in TEST_CASES:
        print(f"\n{case['test_name']}")
        print(f"-> Gửi yêu cầu với phương pháp: {case['payload']['method']}")
        
        try:
            response = requests.post(API_ENDPOINT, json=case['payload'], timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    print(f"✅ THÀNH CÔNG! Đã lấy được {data.get('total_found')} bài viết.")
                    # In thử 1 kết quả đầu tiên để xem cấu trúc
                    if data.get("data"):
                        print("   -> Demo bài đầu tiên:", json.dumps(data.get("data")[0], ensure_ascii=False))
                else:
                    print(f"❌ THẤT BẠI: {data.get('error')}")
            else:
                print(f"❌ LỖI SERVER: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ LỖI KẾT NỐI: {e}")

if __name__ == "__main__":
    run_tests()