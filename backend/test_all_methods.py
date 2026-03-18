import requests
import json

# Thay port 8000 bằng port server của bạn nếu cần
API_ENDPOINT = "http://localhost:8000/api/v1/crawl-test/execute-universal"

TEST_CASES = [
    {
        "test_name": "1️⃣ TEST HTML PARSING (VNExpress - Lấy đoạn HTML thô)",
        "payload": {
            "method": "HTML",
            "url_template": "https://timkiem.vnexpress.net/?q={query}",
            "keyword": "trí tuệ nhân tạo",
            "post_item_sel": "article.item-news"
        }
    },
    {
        "test_name": "2️⃣ TEST SELENIUM / PLAYWRIGHT (Dân Trí - Mở Trình duyệt lấy HTML)",
        "payload": {
            "method": "SELENIUM",
            "url_template": "https://dantri.com.vn/tim-kiem/{query}.htm",
            "keyword": "trí tuệ nhân tạo",
            "post_item_sel": "article.article-item"
        }
    },
    {
        "test_name": "3️⃣ TEST API REQUEST (Hacker News API - Lấy toàn bộ JSON)",
        "payload": {
            "method": "API",
            "url_template": "https://hn.algolia.com/api/v1/search?query={query}",
            "keyword": "Artificial Intelligence"
        }
    },
    {
        "test_name": "4️⃣ TEST REGEX (VNExpress - Cắt lấy Text Regex)",
        "payload": {
            "method": "REGEX",
            "url_template": "https://timkiem.vnexpress.net/?q={query}",
            "keyword": "trí tuệ nhân tạo",
            "regex_pattern": "href=\"(https://vnexpress\\.net/[^\"]+\\.html)\"\\s+title=\"([^\"]+)\""
        }
    }
]

def run_tests():
    print("🚀 BẮT ĐẦU CHẠY KỊCH BẢN KIỂM THỬ (KIẾN TRÚC LẤY RAW DATA)...")
    print("=" * 80)
    
    for case in TEST_CASES:
        print(f"\n{case['test_name']}")
        print(f"-> Đang gửi yêu cầu với phương pháp: {case['payload']['method']}...")
        
        try:
            response = requests.post(API_ENDPOINT, json=case['payload'], timeout=45)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    total = data.get('total_found', 'N/A')
                    print(f"✅ THÀNH CÔNG! Đã lấy được dữ liệu (Số lượng tìm thấy: {total}).")
                    
                    # --- XỬ LÝ IN RA MÀN HÌNH SAO CHO ĐẸP VÀ GỌN ---
                    res_data = data.get("data")
                    if res_data:
                        print("   -> Demo dữ liệu đầu tiên lấy được:")
                        
                        # 1. Trường hợp trả về List (HTML, Selenium, Regex)
                        if isinstance(res_data, list) and len(res_data) > 0:
                            demo_item = res_data[0]
                            demo_str = json.dumps(demo_item, ensure_ascii=False)
                            # Nếu chuỗi HTML quá dài, ta cắt ngắn nó lại để terminal không bị loạn
                            if len(demo_str) > 250:
                                demo_str = demo_str[:250] + " ... [Nội dung HTML/Text đã được cắt bớt cho gọn]"
                            print(f"      {demo_str}")
                            
                        # 2. Trường hợp trả về Object JSON (API)
                        elif isinstance(res_data, dict):
                            demo_str = json.dumps(res_data, ensure_ascii=False)
                            if len(demo_str) > 250:
                                demo_str = demo_str[:250] + " ... [JSON gốc cực dài, đã được cắt bớt cho gọn]"
                            print(f"      {demo_str}")
                else:
                    print(f"❌ THẤT BẠI: {data.get('error')}")
            else:
                print(f"❌ LỖI SERVER: Gặp mã HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ LỖI KẾT NỐI: {e}")

if __name__ == "__main__":
    run_tests()