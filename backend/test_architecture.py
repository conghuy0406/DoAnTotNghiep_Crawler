from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import urllib.parse
import trafilatura
import requests
import time
import json

FAKE_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# ==========================================
# CẤU HÌNH 5 NGUỒN TỪ DATABASE (Đã mở rộng Selector)
# ==========================================
DB_CONFIGS = [
    {
        "name": "VNExpress", "base_url": "https://vnexpress.net",
        "search_url_template": "https://timkiem.vnexpress.net/?q={query}",
        "selectors": {"post_item": "article.item-news", "title": "h3.title-news a"}
    },
    {
        "name": "Dân Trí", "base_url": "https://dantri.com.vn",
        "search_url_template": "https://dantri.com.vn/tim-kiem/{query}.htm",
        "selectors": {"post_item": "article.article-item", "title": "h3.article-title a"}
    },
    {
        "name": "Tuổi Trẻ", "base_url": "https://tuoitre.vn",
        "search_url_template": "https://tuoitre.vn/tim-kiem.htm?keywords={query}", 
        # ĐÃ VÁ: Bắt mọi biến thể giao diện của Tuổi Trẻ
        "selectors": {"post_item": ".box-category-item, .news-item, li.news-item", "title": "h3 a, a.title-news, a.box-category-link-title"} 
    },
    {
        "name": "Thanh Niên", "base_url": "https://thanhnien.vn",
        "search_url_template": "https://thanhnien.vn/tim-kiem.htm?q={query}",
        "selectors": {"post_item": "div.box-category-item", "title": "h3.box-title-text a"}
    },
{
        "name": "Vietnamnet", "base_url": "https://vietnamnet.vn",
        "search_url_template": "https://vietnamnet.vn/tim-kiem?q={query}",
        # Vét sạch mọi biến thể class mới nhất của Vietnamnet
        "selectors": {"post_item": ".feature-box, .vnn-box-item, .sm-item, .news-item", "title": "h3 a, h2 a, .feature-box__content-title a"}
    }
]

# ==========================================
# THUẬT TOÁN "MÓC RUỘT" JSON TỰ ĐỘNG
# ==========================================
def extract_articles_from_json(data, base_url):
    """Hàm đệ quy tự động sục sạo mọi ngóc ngách của file JSON để tìm bài báo"""
    found_articles = []
    
    def search_dict(d):
        if isinstance(d, dict):
            title = d.get('title') or d.get('name')
            link = d.get('link') or d.get('url') or d.get('href')
            
            if title and link and isinstance(title, str) and isinstance(link, str):
                if len(title) > 15 and not link.endswith(('.jpg', '.png', '.css', '.js')):
                    if not link.startswith('http'):
                        link = base_url.rstrip('/') + '/' + link.lstrip('/')
                    found_articles.append({"title": title, "url": link})
            
            for v in d.values():
                search_dict(v)
        elif isinstance(d, list):
            for item in d:
                search_dict(item)
                
    search_dict(data)
    return found_articles

# ==========================================
# CÁC HÀM NỘI SOI ĐA TẦNG
# ==========================================
def test_direct_attack(page, config, keyword):
    """TẦNG 1: Giăng lưới bắt API ngầm -> Cào HTML -> Báo kết quả"""
    print(f"  [TẦNG 1] 🚀 Tiến vào {config['name']} (Đã bật Radar dò API)...")
    
    encoded_kw = urllib.parse.quote_plus(keyword) if "dantri" in config['base_url'] else urllib.parse.quote(keyword)
    search_url = config['search_url_template'].replace("{query}", encoded_kw)
    
    captured_json_articles = []

    def handle_response(response):
        if "application/json" in response.headers.get("content-type", ""):
            try:
                data = response.json()
                articles = extract_articles_from_json(data, config['base_url'])
                if articles:
                    captured_json_articles.extend(articles)
            except:
                pass

    page.on("response", handle_response)
    page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    try:
        # ĐÃ VÁ: Dùng domcontentloaded thay vì networkidle để tránh kẹt quảng cáo
        response = page.goto(search_url, wait_until="domcontentloaded", timeout=25000)
        
        if response and response.status >= 400:
            page.remove_listener("response", handle_response)
            return "FAIL", f"BỊ CHẶN (HTTP {response.status}). WAF quá mạnh.", []

        # ĐÃ VÁ: Chờ API phản hồi, sau đó cuộn trang và chờ HTML render
        page.wait_for_timeout(3000)
        page.evaluate("window.scrollBy(0, 1500)")
        page.wait_for_timeout(2000)
        
        page.remove_listener("response", handle_response)
        
        # PHƯƠNG ÁN A: Tóm được luồng API
        if captured_json_articles:
            unique_articles = {v['url']:v for v in captured_json_articles}.values()
            return "API", "Thành công tuyệt đối không cần Selector!", list(unique_articles)

        # PHƯƠNG ÁN B: Dùng HTML Selector truyền thống
        post_item_sel = config['selectors']['post_item']
        try:
            page.wait_for_selector(post_item_sel, timeout=3000)
        except PlaywrightTimeoutError:
            return "FAIL", f"Không bắt được API & Không tìm thấy thẻ HTML '{post_item_sel}'.", []

        items = page.locator(post_item_sel).all()
        html_articles = []
        for item in items[:5]: 
            title_el = item.locator(config['selectors']['title']).first
            if title_el.count() > 0:
                title = title_el.inner_text().strip()
                url = title_el.get_attribute("href")
                if url and not url.startswith("http"):
                    url = config['base_url'] + '/' + url.lstrip('/')
                if title and url:
                    html_articles.append({"title": title, "url": url})
        
        if html_articles:
            return "HTML", "Sử dụng CSS Selector thành công.", html_articles
        else:
            return "FAIL", "Thấy khung HTML nhưng sai thẻ Title/Link.", []

    except Exception as e:
        page.remove_listener("response", handle_response)
        return "FAIL", f"LỖI: {e}", []

def test_duckduckgo_proxy(page, config, keyword):
    """TẦNG 2: Proxy an toàn (Đã fix lỗi URL Encoding)"""
    print("  [TẦNG 2] 🛡️ Kích hoạt khiên DuckDuckGo Proxy...")
    domain = config['base_url'].replace("https://", "").replace("http://", "")
    
    # Gộp thành 1 câu truy vấn hoàn chỉnh rồi mới mã hóa toàn bộ
    query_str = f"site:{domain} {keyword}"
    safe_query = urllib.parse.quote_plus(query_str)
    
    search_url = f"https://html.duckduckgo.com/html/?q={safe_query}&df=m"
    
    try:
        page.goto(search_url, wait_until="domcontentloaded", timeout=15000)
        page.wait_for_timeout(2000)
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
        return False, "Không tìm thấy kết quả."
    except Exception as e:
        return False, f"LỖI DuckDuckGo: {e}"

def test_detail_extraction(article_url):
    """TẦNG 3: Kiểm tra Trafilatura"""
    print(f"  [TẦNG 3] 📥 Hút text nội dung: {article_url}")
    try:
        response = requests.get(article_url, headers={"User-Agent": FAKE_USER_AGENT}, timeout=10)
        text = trafilatura.extract(response.text, include_comments=False)
        if text and len(text) > 50:
            return True, f"Thành công! Lấy được {len(text)} ký tự."
        return False, "Trafilatura không đọc được nội dung."
    except Exception as e:
        return False, f"LỖI REQUEST: {e}"

# ==========================================
# TRÌNH ĐIỀU PHỐI MASTER
# ==========================================
def run_ultimate_lab(keyword="công nghệ"):
    print("="*85)
    print(f"🏥 ULTIMATE LAB: KIỂM TRA ĐA PHƯƠNG THỨC TRONG 1 LẦN CHẠY (Từ khóa: '{keyword}')")
    print("="*85)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent=FAKE_USER_AGENT)
        page = context.new_page()

        for config in DB_CONFIGS:
            print(f"\n🔎 ĐANG NỘI SOI: {config['name'].upper()}")
            
            # Khởi chạy Tầng 1 (API + HTML đồng thời)
            status_1, msg_1, working_links = test_direct_attack(page, config, keyword)
            
            if status_1 == "API":
                print(f"   ✅ [TẦNG 1] BẮT MẠCH API JSON THÀNH CÔNG: Lấy được {len(working_links)} bài.")
                print(f"      -> Bí quyết: {msg_1}")
            elif status_1 == "HTML":
                print(f"   ✅ [TẦNG 1] CÀO DOM HTML THÀNH CÔNG: Lấy được {len(working_links)} bài.")
                print(f"      -> Bí quyết: {msg_1}")
            else:
                print(f"   ❌ [TẦNG 1] ĐÁNH TRỰC DIỆN THẤT BẠI: {msg_1}")
                # Kích hoạt Tầng 2 nếu Tầng 1 sụp hoàn toàn
                success_2, working_links_proxy = test_duckduckgo_proxy(page, config, keyword)
                if success_2:
                    print(f"   ✅ [TẦNG 2] CỨU THUA BẰNG DUCKDUCKGO PROXY: Vớt được {len(working_links_proxy)} bài.")
                    working_links = working_links_proxy
                else:
                    print(f"   ❌ [TẦNG 2] LỖI PROXY: {working_links_proxy}")

            # Kích hoạt Tầng 3 nếu có link
            if working_links:
                success_3, msg_3 = test_detail_extraction(working_links[0]['url'])
                if success_3:
                    print(f"   ✅ [TẦNG 3] {msg_3}")
                else:
                    print(f"   ❌ [TẦNG 3] {msg_3}")

            print("-" * 85)

        browser.close()

if __name__ == "__main__":
    run_ultimate_lab("công nghệ")