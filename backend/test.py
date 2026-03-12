from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import urllib.parse
import trafilatura
import requests

FAKE_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# ==========================================
# CẤU HÌNH TEST
# ==========================================
DB_CONFIGS = [
    {
        "name": "Vietnamnet", "base_url": "https://vietnamnet.vn",
        "search_url_template": "https://vietnamnet.vn/tim-kiem?q={query}",
        "selectors": {"post_item": ".vnn-box-item, .search-result-item, .article-item, .feature-box", "title": "h3 a, a.vnn-title, a[title]"}
    },
    {
        "name": "Tuổi Trẻ", "base_url": "https://tuoitre.vn",
        "search_url_template": "https://tuoitre.vn/tim-kiem.htm?keywords={query}", 
        "selectors": {"post_item": ".box-category-item, .news-item, li.news-item", "title": "h3 a, a.title-news, a.box-category-link-title"} 
    }
]

# ==========================================
# HÀM BỔ TRỢ & ĐÁNH GIÁ (DIAGNOSTIC)
# ==========================================
def extract_articles_from_json(data, base_url):
    found_articles = []
    def search_dict(d):
        if isinstance(d, dict):
            title = d.get('title') or d.get('name')
            link = d.get('link') or d.get('url') or d.get('href')
            if title and link and isinstance(title, str) and isinstance(link, str):
                if len(title) > 15 and not link.endswith(('.jpg', '.png', '.css', '.js')):
                    if not link.startswith('http'): link = base_url.rstrip('/') + '/' + link.lstrip('/')
                    found_articles.append({"title": title, "url": link})
            for v in d.values(): search_dict(v)
        elif isinstance(d, list):
            for item in d: search_dict(item)
    search_dict(data)
    return found_articles

def test_direct_attack(page, config, keyword):
    """Đánh trực tiếp và chụp lại lý do thất bại"""
    encoded_kw = urllib.parse.quote_plus(keyword) if "dantri" in config['base_url'] else urllib.parse.quote(keyword)
    search_url = config['search_url_template'].replace("{query}", encoded_kw)
    captured_json_articles = []

    def handle_response(response):
        if "application/json" in response.headers.get("content-type", ""):
            try:
                data = response.json()
                articles = extract_articles_from_json(data, config['base_url'])
                if articles: captured_json_articles.extend(articles)
            except: pass

    page.on("response", handle_response)
    page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    try:
        response = page.goto(search_url, wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(3000)
        
        # Bắt lỗi Tường lửa gắt (Trả về mã lỗi HTTP)
        if response and response.status >= 400:
            page.remove_listener("response", handle_response)
            return "FAIL", f"Server báo lỗi HTTP {response.status}.", []

        # Chẩn đoán: Liệu có bị Captcha hay trang chặn bot không?
        page_title = page.title().lower()
        if "captcha" in page_title or "cloudflare" in page_title or "access denied" in page_title:
             page.remove_listener("response", handle_response)
             return "FAIL", "Bị tường lửa chặn ở mức giao diện (Đòi giải Captcha).", []

        page.evaluate("window.scrollBy(0, 1500)")
        page.wait_for_timeout(2000)
        page.remove_listener("response", handle_response)
        
        # Kiểm tra API
        if captured_json_articles:
            unique = {v['url']:v for v in captured_json_articles}.values()
            return "API", "Bắt được API JSON ngầm.", list(unique)

        # Kiểm tra Selector
        post_item_sel = config['selectors']['post_item']
        items = page.locator(post_item_sel).all()
        if not items:
            return "FAIL", f"Không bắt được API. Về mặt HTML, trang load thành công nhưng hoàn toàn KHÔNG TỒN TẠI class '{post_item_sel}'. (Khả năng cao: Bạn nhập sai Selector, hoặc Web đã đổi giao diện).", []

        html_articles = []
        for item in items[:5]: 
            title_el = item.locator(config['selectors']['title']).first
            if title_el.count() > 0:
                title = title_el.inner_text().strip()
                url = title_el.get_attribute("href")
                if url and not url.startswith("http"): url = config['base_url'] + '/' + url.lstrip('/')
                if title and url: html_articles.append({"title": title, "url": url})
        
        if html_articles:
            return "HTML", "Selector chuẩn xác.", html_articles
        else:
            return "FAIL", "Thấy khung HTML nhưng thẻ Title/Link bên trong bị cấu hình sai.", []
    except PlaywrightTimeoutError:
        return "FAIL", "Trang web load quá chậm (Timeout).", []
    except Exception as e:
        return "FAIL", f"Lỗi không xác định: {e}", []

def test_duckduckgo_proxy(page, config, keyword):
    domain = config['base_url'].replace("https://", "").replace("http://", "")
    # Bỏ &df=m để mở rộng tối đa khả năng tìm kiếm, tránh việc DuckDuckGo không index tháng vừa qua
    query_str = f"site:{domain} {keyword}"
    search_url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote_plus(query_str)}"
    
    try:
        page.goto(search_url, wait_until="domcontentloaded", timeout=15000)
        
        # Chẩn đoán DuckDuckGo
        if "Traffic" in page.title() or "Robot" in page.title():
             return False, "DuckDuckGo đã phát hiện bạn là Bot và chặn IP."

        items = page.locator("div.result").all()
        results = []
        for item in items[:5]:
            title_el = item.locator("h2.result__title a").first
            if title_el.count() > 0:
                title = title_el.inner_text().strip()
                href = title_el.get_attribute("href")
                if "duckduckgo.com/l/?uddg=" in href:
                    qs = urllib.parse.parse_qs(urllib.parse.urlparse(href).query)
                    if 'uddg' in qs: href = urllib.parse.unquote(qs['uddg'][0])
                if domain in href and not any(x in href for x in ["/video", "/podcast"]):
                    results.append({"title": title, "url": href})
        
        if results: return True, results
        return False, f"DuckDuckGo không lưu bất kỳ dữ liệu nào của '{domain}' với từ khóa này."
    except Exception as e:
        return False, f"Lỗi Proxy: {e}"

# ==========================================
# TRÌNH MASTER - IN KẾT LUẬN CHUYÊN SÂU
# ==========================================
def run_diagnostic_lab(keyword="công nghệ"):
    print("="*85)
    print(f"🏥 DIAGNOSTIC LAB: CHẨN ĐOÁN LÝ DO KHÔNG THỂ CRAWL (Từ khóa: '{keyword}')")
    print("="*85)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent=FAKE_USER_AGENT)
        page = context.new_page()

        for config in DB_CONFIGS:
            print(f"\n🔎 ĐANG KHÁM BỆNH CHO: {config['name'].upper()}")
            
            status_1, msg_1, working_links = test_direct_attack(page, config, keyword)
            success_2 = False
            msg_2 = ""
            
            if status_1 != "FAIL":
                print(f"   ✅ [TẦNG 1] Xanh chín! Lấy được {len(working_links)} bài.")
            else:
                print(f"   ❌ [TẦNG 1] Thất bại.")
                success_2, proxy_results = test_duckduckgo_proxy(page, config, keyword)
                if success_2:
                    working_links = proxy_results
                    print(f"   ✅ [TẦNG 2] Proxy cứu vớt được {len(working_links)} bài.")
                else:
                    msg_2 = proxy_results
                    print(f"   ❌ [TẦNG 2] Thất bại nốt.")

            # IN BẢNG KẾT LUẬN TỔNG QUAN
            print("\n   " + "="*50)
            print(f"   📋 KẾT LUẬN CHO NGUỒN: {config['name']}")
            if working_links:
                print("   ➡️ TRẠNG THÁI: CÓ THỂ CRAWL ĐƯỢC 🟢")
                print(f"   ➡️ PHƯƠNG PHÁP: {'Trực tiếp (Tầng 1)' if status_1 != 'FAIL' else 'Qua Proxy (Tầng 2)'}")
            else:
                print("   ➡️ TRẠNG THÁI: KHÔNG THỂ CRAWL BẰNG CẤU HÌNH HIỆN TẠI 🔴")
                print("   ➡️ VÌ SAO?")
                print(f"      - Ở Tầng 1 (Cào trực tiếp): {msg_1}")
                print(f"      - Ở Tầng 2 (Dùng Proxy)   : {msg_2}")
                print("   ➡️ HƯỚNG DẪN SỬA:")
                print("      1. Bật trình duyệt ẩn danh, vào link tìm kiếm của báo này kiểm tra lại CSS Selector.")
                print("      2. Nếu web đòi xác minh Captcha, bạn KHÔNG THỂ cào tự động trang này được nữa.")
            print("   " + "="*50)

        browser.close()

if __name__ == "__main__":
    run_diagnostic_lab()