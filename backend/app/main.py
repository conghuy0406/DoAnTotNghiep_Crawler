# --- 1. FIX LỖI WINDOWS PLAYWRIGHT (BẮT BUỘC Ở DÒNG ĐẦU) ---
import sys
import asyncio
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

# --- THƯ VIỆN HỆ THỐNG ---
import os
import re
import json
import urllib.parse
import requests
from bs4 import BeautifulSoup

# --- THƯ VIỆN BÊN THỨ 3 ---
import google.generativeai as genai
from pydantic import BaseModel, field_validator
from typing import Optional, Dict, Any, List
from playwright.sync_api import sync_playwright

# --- FASTAPI & LOCAL MODULES ---
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool

# Import các Router và Dependency bảo mật từ dự án của bạn
from app.api import crawl, auth, source, history, bookmarks, export, users 
from app.celery_worker import run_smart_crawl_task, celery_app
from app.api.auth import get_current_user  # 🔒 Lấy hàm kiểm tra Token từ auth.py

app = FastAPI()

# --- 2. CẤU HÌNH CORS ---
origins = [
    "http://localhost",
    "http://localhost:3000", 
    "http://localhost:5173", 
    "https://80c9-123-21-33-197.ngrok-free.app", 
    "*"                      
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

# --- 3. ĐĂNG KÝ ROUTER ---
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"]) 
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"]) 
app.include_router(crawl.router, prefix="/api/v1", tags=["Crawl"])
app.include_router(source.router, prefix="/api/v1/sources", tags=["Source Config"])
app.include_router(history.router)
app.include_router(bookmarks.router)
app.include_router(export.router)

@app.get("/")
async def root():
    return {"message": "Backend API is Ready (Secured & Fixed 100%)!"}


# =====================================================================
# CHỨC NĂNG CRAWL TỪ API JSON
# =====================================================================
def auto_extract_json(data):
    found = []
    def search_d(d):
        if isinstance(d, dict):
            t = d.get('title') or d.get('name')
            l = d.get('link') or d.get('url') or d.get('href')
            if t and l and isinstance(t, str) and isinstance(l, str):
                found.append({"title": t, "url": l})
            for v in d.values(): search_d(v)
        elif isinstance(d, list):
            for item in d: search_d(item)
    search_d(data)
    return found

class ApiPayload(BaseModel):
    api_url: str
    api_method: str = "GET"
    headers: Optional[Dict[str, str]] = None
    payload: Optional[Dict[str, Any]] = None

def run_api_crawl(data: ApiPayload):
    try:
        if data.api_method.upper() == "POST":
            res = requests.post(data.api_url, headers=data.headers, json=data.payload, timeout=10)
        else:
            res = requests.get(data.api_url, headers=data.headers, timeout=10)
        
        if res.status_code == 200:
            raw_json = res.json()
            extracted_data = auto_extract_json(raw_json)[:5]
            
            if len(extracted_data) > 0:
                return {"status": "success", "data": extracted_data}
            else:
                return {"status": "success", "data": raw_json}
                
        return {"error": f"Lỗi HTTP {res.status_code}"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/v1/crawl-test/api", tags=["Test Crawl"])
async def test_crawl_api(payload: ApiPayload, current_user: dict = Depends(get_current_user)): # 🔒 Bảo mật
    return await run_in_threadpool(run_api_crawl, payload)


# =====================================================================
# CHỨC NĂNG CRAWL BẰNG BIỂU THỨC CHÍNH QUY (REGEX)
# =====================================================================
class RegexPayload(BaseModel):
    url: str
    regex_pattern: str

def run_regex_crawl(data: RegexPayload):
    try:
        html_text = requests.get(data.url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10).text
        matches = re.findall(data.regex_pattern, html_text)
        
        results = [{"match_data": match} for match in matches[:5]]
        return {"status": "success", "data": results}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/v1/crawl-test/regex", tags=["Test Crawl"])
async def test_crawl_regex(payload: RegexPayload, current_user: dict = Depends(get_current_user)): # 🔒 Bảo mật
    return await run_in_threadpool(run_regex_crawl, payload)


# =====================================================================
# CHỨC NĂNG BROWSER CRAWL (MANUAL CSS SELECTORS) - ĐÃ CẬP NHẬT AUTO-DETECT
# =====================================================================
class BrowserPayload(BaseModel):
    url: str
    crawl_method: Optional[str] = "BROWSER"
    post_item_sel: Optional[str] = None
    title_sel: Optional[str] = None
    thumb_sel: Optional[str] = None     # 🌟 Nhận Selector Ảnh
    price_sel: Optional[str] = None     # 🌟 Nhận Selector Giá
    sales_sel: Optional[str] = None    # 🌟 THÊM DÒNG NÀY
    rating_sel: Optional[str] = None
    discount_sel: Optional[str] = None  # 🌟 Nhận Selector Giảm giá
    keyword: Optional[str] = ""

KNOWN_SITES = {
    "shopee.vn": {
        "post_item_sel": "li.col-xs-2-4, .shopee-search-item-result__item",
        "title_sel": "div[data-sqe='name'], div.ie3A-n"
    },
    "tiki.vn": {
        "post_item_sel": "a.product-item",
        "title_sel": "div.name h3, div.name"
    }
}

# =====================================================================
# CHỨC NĂNG BROWSER CRAWL (MANUAL CSS SELECTORS) - ĐÃ FIX LỖI ẢNH TIKI
# =====================================================================
# =====================================================================
# CHỨC NĂNG BROWSER CRAWL (MANUAL CSS SELECTORS) - BẢN HOÀN HẢO 100%
# =====================================================================
# =====================================================================
# CHỨC NĂNG BROWSER CRAWL (MANUAL CSS SELECTORS) - BẢN HOÀN HẢO 100%
# =====================================================================
def run_browser_crawl(data: BrowserPayload):
    results = []
    try:
        domain = urllib.parse.urlparse(data.url).netloc.replace("www.", "")
        actual_post_sel = data.post_item_sel
        actual_title_sel = data.title_sel
        mode_used = "MANUAL_ENGINEER"
        
        if not actual_post_sel or not actual_title_sel:
            if domain in KNOWN_SITES:
                actual_post_sel = KNOWN_SITES[domain]["post_item_sel"]
                actual_title_sel = KNOWN_SITES[domain]["title_sel"]
                mode_used = f"AUTO_SMART_DICT ({domain})"
            else:
                mode_used = "AUTO_DETECT"

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False, args=['--disable-blink-features=AutomationControlled'])
            context = browser.new_context(viewport={'width': 1920, 'height': 1080})
            page = context.new_page()
            
            page.goto(data.url, wait_until="domcontentloaded", timeout=25000)
            page.wait_for_timeout(3000)
            
            # 🌟 TỰ ĐỘNG CUỘN CHUỘT LẤY ẢNH & GIÁ
            for _ in range(4):
                page.evaluate("window.scrollBy(0, 1000)")
                page.wait_for_timeout(1500)
            
            # 🎯 TRƯỜNG HỢP 1: BẬT CHẾ ĐỘ KỸ SƯ HOẶC CÓ TRONG KNOWN_SITES
            if actual_post_sel and actual_title_sel:
                items = page.locator(actual_post_sel).all()
                
                # 🌟 NÂNG GIỚI HẠN LÊN 30 ĐỂ KHÔNG BỎ SÓT SẢN PHẨM NÀO
                for item in items[:30]:
                    t_el = item.locator(actual_title_sel).first
                    if t_el.count() > 0:
                        # Xử lý lấy Title (Nếu là thẻ img thì lấy thuộc tính alt)
                        tag_name = t_el.evaluate("el => el.tagName")
                        if tag_name == "IMG":
                            title_text = t_el.get_attribute("alt") or "Không có tên"
                        else:
                            title_text = t_el.inner_text().strip()
                        
                        # 🌟 FIX LỖI LINK (URL) CHO CÁC SẢN PHẨM QUẢNG CÁO (Tiki Ads)
                        url_link = t_el.get_attribute("href")
                        if not url_link and item.evaluate("el => el.tagName") == "A":
                            url_link = item.get_attribute("href")
                            
                        if url_link:
                            if url_link.startswith("//"):
                                url_link = "https:" + url_link
                            elif not url_link.startswith("http"):
                                url_link = f"https://{domain}{url_link}"
                             
                        # 🌟 LẤY THÊM DỮ LIỆU MỞ RỘNG (DÙNG JS ĐỂ MOI ẢNH 100% CHÍNH XÁC)
                        thumb = ""
                        if data.thumb_sel:
                            try:
                                thumb = item.evaluate(f"""el => {{
                                    let img = el.querySelector('{data.thumb_sel}');
                                    if (!img) return "";
                                    let url = img.getAttribute("src") || img.getAttribute("srcset") || img.getAttribute("data-src") || "";
                                    return url.split(" ")[0];
                                }}""")
                            except: pass

                        # 🌟 FIX LỖI ẨN GIẢM GIÁ & GIÁ (Thay inner_text bằng textContent thông qua JS)
                        price = ""
                        if data.price_sel:
                            try:
                                price = item.evaluate(f"""el => {{
                                    let p = el.querySelector('{data.price_sel}');
                                    return p ? p.textContent.trim() : "";
                                }}""")
                            except: pass
                            
                        discount = ""
                        if data.discount_sel:
                            try:
                                discount = item.evaluate(f"""el => {{
                                    let d = el.querySelector('{data.discount_sel}');
                                    return d ? d.textContent.trim() : "";
                                }}""")
                            except: pass
                             
                        # ... (Code lấy price và discount ở trên) ...

                        # 🌟 MOI LƯỢT BÁN
                        sales = ""
                        if data.sales_sel:
                            try:
                                sales = item.evaluate(f"""el => {{
                                    let s = el.querySelector('{data.sales_sel}');
                                    return s ? s.textContent.trim() : "";
                                }}""")
                            except: pass

                        # 🌟 MOI ĐÁNH GIÁ (RATING)
                        rating = ""
                        if data.rating_sel:
                            try:
                                rating = item.evaluate(f"""el => {{
                                    let r = el.querySelector('{data.rating_sel}');
                                    return r ? r.textContent.trim() : "";
                                }}""")
                            except: pass
                             
                        if title_text:
                            results.append({
                                "title": title_text, 
                                "url": url_link or data.url,
                                "thumbnail": thumb,
                                "price": price,
                                "discount": discount,
                                "sales": sales,   # 🌟 LƯU VÀO ĐÂY ĐỂ TRẢ VỀ FRONTEND
                                "rating": rating  # 🌟 LƯU VÀO ĐÂY ĐỂ TRẢ VỀ FRONTEND
                            })     
                        if title_text:
                            results.append({
                                "title": title_text, 
                                "url": url_link or data.url,
                                "thumbnail": thumb,
                                "price": price,
                                "discount": discount
                            })
            # 🤖 TRƯỜNG HỢP 2: AUTO-DETECT
            else:
                links = page.locator("a").all()
                seen_urls = set()
                for link in links:
                    try:
                        raw_text = link.inner_text().strip()
                        url = link.get_attribute("href")
                        if not url or not raw_text: continue
                            
                        lines = [line.strip() for line in raw_text.split('\n') if len(line.strip()) > 10]
                        if not lines: continue
                        best_title = max(lines, key=len)
                        
                        if len(best_title) > 20 and url not in seen_urls:
                            if not url.startswith("http"): url = f"https://{domain}{url}"
                            results.append({"title": best_title, "url": url, "thumbnail": "", "price": "", "discount": ""})
                            seen_urls.add(url)
                            
                        if len(results) >= 15: break
                    except Exception:
                        continue
            browser.close()
            
        # 🚨 KIỂM TRA MÙ MỜ ĐỂ YÊU CẦU BẬT CHẾ ĐỘ KỸ SƯ
        if mode_used == "AUTO_DETECT" and len(results) == 0:
            return {"status": "require_engineer", "message": f"Hệ thống không thể tự động nhận diện cấu trúc của trang {domain}. Vui lòng bật Chế độ Kỹ sư."}

        return {
            "status": "success", 
            "mode": mode_used, 
            "total_found": len(results),
            "data": results
        }
    except Exception as e:
        return {"error": str(e)}
@app.post("/api/v1/crawl-test/browser", tags=["Test Crawl"])
async def test_crawl_browser(payload: BrowserPayload, current_user: dict = Depends(get_current_user)):
    return await run_in_threadpool(run_browser_crawl, payload)


# =====================================================================
# CHỨC NĂNG CRAWL HTML TĨNH (NHANH - BỎ QUA JS) - ĐÃ CẬP NHẬT AUTO-DETECT
# =====================================================================
class HtmlPayload(BaseModel):
    url: str
    post_item_sel: Optional[str] = None  # ✅ ĐÃ SỬA THÀNH OPTIONAL
    title_sel: Optional[str] = None      # ✅ ĐÃ SỬA THÀNH OPTIONAL
    thumb_sel: Optional[str] = None    
    price_sel: Optional[str] = None    
    discount_sel: Optional[str] = None  

def run_html_crawl(data: HtmlPayload):
    results = []
    try:
        domain = urllib.parse.urlparse(data.url).netloc.replace("www.", "")
        mode_used = "MANUAL_ENGINEER" 
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            # Chặn tải tài nguyên dư thừa để chạy cực nhanh
            page.route("**/*", lambda route: route.continue_() if route.request.resource_type == "document" else route.abort())
            page.goto(data.url, wait_until="domcontentloaded", timeout=15000)
            
            # 🎯 TRƯỜNG HỢP 1: BẬT CHẾ ĐỘ KỸ SƯ (Có nhập Selector)
            if data.post_item_sel and data.title_sel:
                items = page.locator(data.post_item_sel).all()
                for item in items[:15]: 
                    t_el = item.locator(data.title_sel).first
                    if t_el.count() > 0:
                        tag_name = t_el.evaluate("el => el.tagName")
                        if tag_name == "IMG":
                            title_text = t_el.get_attribute("alt") or "Không có tên"
                        else:
                            title_text = t_el.inner_text().strip()
                        
                        url_link = t_el.get_attribute("href")
                        if not url_link and item.evaluate("el => el.tagName") == "A":
                            url_link = item.get_attribute("href")
                        if url_link and not url_link.startswith("http"):
                            url_link = f"https://{domain}{url_link}"

                        thumb = item.locator(data.thumb_sel).first.get_attribute("src") if data.thumb_sel and item.locator(data.thumb_sel).count() > 0 else ""
                        price = item.locator(data.price_sel).first.inner_text().strip() if data.price_sel and item.locator(data.price_sel).count() > 0 else ""
                        discount = item.locator(data.discount_sel).first.inner_text().strip() if data.discount_sel and item.locator(data.discount_sel).count() > 0 else ""

                        if title_text:
                            results.append({
                                "title": title_text,
                                "url": url_link or data.url,
                                "thumbnail": thumb, "price": price, "discount": discount
                            })
                            
            # 🤖 TRƯỜNG HỢP 2: AUTO DETECT
            else:
                mode_used = "AUTO_DETECT"
                links = page.locator("a").all()
                seen_urls = set()
                
                for link in links:
                    try:
                        raw_text = link.inner_text().strip()
                        url_link = link.get_attribute("href")
                        
                        if not url_link or not raw_text: continue
                        
                        # Loại bỏ các khoảng trắng thừa và xuống dòng
                        clean_title = " ".join(raw_text.split())
                        
                        if len(clean_title) > 25 and url_link not in seen_urls:
                            if not url_link.startswith("http"): 
                                url_link = f"https://{domain}{url_link}"
                                
                            results.append({
                                "title": clean_title, 
                                "url": url_link,
                                "thumbnail": "", "price": "", "discount": ""
                            })
                            seen_urls.add(url_link)
                            
                        if len(results) >= 15: break 
                    except Exception:
                        continue

            browser.close()
            
        # 🚨 KIỂM TRA MÙ MỜ YÊU CẦU BẬT CHẾ ĐỘ KỸ SƯ
        if mode_used == "AUTO_DETECT" and len(results) == 0:
            return {"status": "require_engineer", "message": f"Không thể tự động nhận diện trang {domain}. Vui lòng bật Chế độ Kỹ sư."}

        return {
            "status": "success", 
            "mode": mode_used, 
            "total_found": len(results), 
            "data": results
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/v1/crawl-test/html", tags=["Test Crawl"])
async def test_crawl_html(payload: HtmlPayload, current_user: dict = Depends(get_current_user)):
    return await run_in_threadpool(run_html_crawl, payload)


# =====================================================================
# ĐỈNH CAO: SMART CRAWL BẰNG GEMINI AI (100% TRÍ TUỆ NHÂN TẠO)
# =====================================================================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyBPz3Wzlxaf7U8DYOLJAUSC0Yv0wnXghOw").strip() 
genai.configure(api_key=GEMINI_API_KEY)

class SmartPayload(BaseModel):
    url: str

    # ✅ Tự động loại bỏ ký tự xuống dòng gây lỗi JSON
    @field_validator('url')
    @classmethod
    def clean_url(cls, v):
        return v.strip().replace("\n", "").replace("\r", "")

def clean_json_string(raw_response: str) -> str:
    cleaned = raw_response.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()

def run_smart_auto_crawl(data: SmartPayload, user_id: str):
    results = []
    try:
        domain = urllib.parse.urlparse(data.url).netloc.replace("www.", "")
        mode = f"FULL_AI_LLM ({domain})"
        
        print(f"🕵️‍♂️ [SMART AI] User '{user_id}' đang phân tích trang: {domain}")
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--disable-blink-features=AutomationControlled'])
            context = browser.new_context(viewport={'width': 1280, 'height': 800}, user_agent="Mozilla/5.0")
            page = context.new_page()
            
            page.goto(data.url, wait_until="domcontentloaded", timeout=25000)
            page.wait_for_timeout(2000)
            
            for _ in range(2): 
                page.evaluate("window.scrollBy(0, 800)")
                page.wait_for_timeout(800)

            # ✨ TỐI ƯU JS: Đã sửa .append thành .push()
            raw_text = page.evaluate("""
                () => {
                    const junk = document.querySelectorAll('script, style, iframe, footer, nav, noscript');
                    junk.forEach(el => el.remove());

                    const elements = document.querySelectorAll('h1, h2, h3, h4, a, p');
                    let content = [];
                    
                    elements.forEach(el => {
                        let text = el.innerText.trim();
                        if (text.length < 5) return; 

                        if (el.tagName === 'A' && el.href.startsWith('http')) {
                            if (text.length > 20) {
                                content.push(`[LINK_BAI_VIET]: ${text} | URL: ${el.href}`);
                            }
                        } else {
                            content.push(`${el.tagName}: ${text}`);
                        }
                    });
                    
                    return content.join('\\n').slice(0, 12000); 
                }
            """)
            
            safe_text = raw_text[:12000] 

            # Dùng {{ }} để Python không hiểu nhầm JSON là biến
            prompt = f"""
            Bạn là một chuyên gia phân tích dữ liệu. Hãy trích xuất thông tin từ nội dung web thô của trang {domain}.
            
            YÊU CẦU:
            1. Trả về mảng JSON duy nhất.
            2. Nếu nội dung có [LINK_BAI_VIET], hãy ưu tiên sử dụng URL đi kèm đó cho trường "link".
            3. Nếu link thiếu domain, hãy tự động nối thêm https://{domain}.
            
            ĐỊNH DẠNG JSON:
            [
              {{
                "title": "Tiêu đề",
                "link": "URL chính xác",
                "description": "Tóm tắt ngắn",
                "topic": "Chủ đề",
                "sentiment": "Tích cực | Tiêu cực | Trung lập",
                "sentiment_reason": "Lý do ngắn",
                "detailed_analysis": "Phân tích sâu (khoảng 100 chữ)",
                "tags": ["Tag1", "Tag2"]
              }}
            ]

            NỘI DUNG:
            {safe_text}
            """

            try:
                model = genai.GenerativeModel('gemini-2.5-flash')
                response = model.generate_content(prompt)
                
                if not response.text:
                    raise Exception("AI không trả về kết quả")
                    
                json_string = clean_json_string(response.text)
                results = json.loads(json_string)
                
            except Exception as ai_err:
                if "429" in str(ai_err):
                    return {"status": "error", "message": "Hệ thống AI đang bận (hết Quota), vui lòng đợi 60s."}
                return {"status": "error", "message": f"Lỗi AI: {str(ai_err)}"}

            browser.close()
            
        return {"status": "success", "mode": mode, "total_found": len(results), "data": results}
        
    except Exception as e:
        return {"status": "error", "message": f"Lỗi hệ thống: {str(e)}"}

@app.post("/api/v1/crawl-test/smart-auto", tags=["Test Crawl"])
async def test_smart_auto(payload: SmartPayload, current_user: dict = Depends(get_current_user)): # 🔒 Bảo mật
    user_id = current_user["id"]
    return await run_in_threadpool(run_smart_auto_crawl, payload, user_id)


# =====================================================================
# BỘ CÔNG CỤ CRAWL ĐA NĂNG MỚI (KIẾN TRÚC RAW DATA FETCHING)
# =====================================================================
class UniversalCrawlPayload(BaseModel):
    method: str  
    url_template: str  
    keyword: str
    post_item_sel: Optional[str] = None 
    regex_pattern: Optional[str] = None

def execute_universal_crawl(payload: UniversalCrawlPayload):
    method = payload.method.upper().strip()
    encoded_kw = urllib.parse.quote_plus(payload.keyword) if payload.keyword else ""
    target_url = payload.url_template.replace("{query}", encoded_kw)
    results = []

    try:
        if method == "HTML":
            if not payload.post_item_sel: return {"error": "Thiếu post_item_sel"}
            res = requests.get(target_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
            soup = BeautifulSoup(res.text, "html.parser")
            items = soup.select(payload.post_item_sel)
            for item in items[:5]: results.append({"raw_html_chunk": str(item)})

        elif method == "API":
            res = requests.get(target_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
            return {"status": "success", "method_used": method, "data": res.json()}

        elif method == "SELENIUM":
            if not payload.post_item_sel: return {"error": "Thiếu post_item_sel"}
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True, args=['--disable-blink-features=AutomationControlled']) 
                context = browser.new_context(viewport={'width': 1280, 'height': 720}, user_agent="Mozilla/5.0")
                page = context.new_page()
                page.goto(target_url, wait_until="domcontentloaded", timeout=25000)
                page.wait_for_timeout(2000)
                items = page.locator(payload.post_item_sel).all()
                for item in items[:5]: results.append({"raw_html_chunk": item.evaluate("el => el.outerHTML")})
                browser.close()

        elif method == "REGEX":
            if not payload.regex_pattern: return {"error": "Thiếu regex_pattern"}
            res = requests.get(target_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
            matches = re.findall(payload.regex_pattern, res.text)
            for match in matches[:10]: results.append({"raw_text_match": match})
            
        return {"status": "success", "method_used": method, "total_found": len(results), "data": results}

    except Exception as e:
        return {"error": f"Lỗi hệ thống khi chạy mode {method}: {str(e)}"}

@app.post("/api/v1/crawl-test/execute-universal", tags=["Universal Crawl"])
async def run_universal_crawl_test(payload: UniversalCrawlPayload, current_user: dict = Depends(get_current_user)): # 🔒 Bảo mật
    return await run_in_threadpool(execute_universal_crawl, payload)


# =====================================================================
# CHỨC NĂNG CELERY TASK QUEUE (HÀNG ĐỢI BẤT ĐỒNG BỘ)
# =====================================================================
class StartTaskPayload(BaseModel):
    url: str

@app.post("/api/v1/tasks/start-crawl", tags=["Task Queue"])
async def start_crawl_task(payload: StartTaskPayload, current_user: dict = Depends(get_current_user)): # 🔒 Bảo mật
    task = run_smart_crawl_task.delay(payload.url)
    return {"status": "Processing", "task_id": task.id}

@app.get("/api/v1/tasks/{task_id}", tags=["Task Queue"])
async def get_task_status(task_id: str, current_user: dict = Depends(get_current_user)): # 🔒 Bảo mật
    task_result = celery_app.AsyncResult(task_id)
    result = {
        "task_id": task_id,
        "task_status": task_result.state,
    }

    if task_result.state == 'PROGRESS':
        result['progress'] = task_result.info.get('current', 0)
        result['total'] = task_result.info.get('total', 100)
        result['message'] = task_result.info.get('status', '')
    elif task_result.state == 'SUCCESS':
        result['data'] = task_result.result
    elif task_result.state == 'FAILURE':
        result['error'] = str(task_result.info)
        
    return result


# =====================================================================
# TỰ ĐỘNG LÊN LỊCH & LỊCH SỬ CÀO (CÓ BẢO MẬT USER_ID)
# =====================================================================
SCHEDULE_DB = "schedules.json"

class UserSchedule(BaseModel):
    keyword: str
    time: str  
    is_active: bool = True

@app.post("/api/v1/schedules", tags=["Auto Schedule"])
async def create_schedule(data: UserSchedule, current_user: dict = Depends(get_current_user)): # 🔒 Bảo mật
    schedules = []
    user_id = current_user["id"]
    
    if os.path.exists(SCHEDULE_DB):
        with open(SCHEDULE_DB, "r", encoding="utf-8") as f:
            try: schedules = json.load(f)
            except: pass
    
    # Lưu kèm ID để phân biệt
    schedules.append({
        "user_id": user_id,
        "keyword": data.keyword, 
        "time": data.time, 
        "is_active": data.is_active
    })
    
    with open(SCHEDULE_DB, "w", encoding="utf-8") as f:
        json.dump(schedules, f, ensure_ascii=False, indent=4)
        
    return {"status": "success", "message": f"Đã lên lịch! Sẽ tự động cào '{data.keyword}' lúc {data.time}"}

@app.get("/api/v1/schedules", tags=["Auto Schedule"])
async def get_schedules(current_user: dict = Depends(get_current_user)): # 🔒 Bảo mật
    user_id = current_user["id"]
    if os.path.exists(SCHEDULE_DB):
        with open(SCHEDULE_DB, "r", encoding="utf-8") as f:
            try:
                all_schedules = json.load(f)
                # Chỉ trả về dữ liệu của user đang đăng nhập
                my_schedules = [s for s in all_schedules if s.get("user_id") == user_id]
                return my_schedules
            except:
                return []
    return []

@app.get("/api/v1/schedules/history", tags=["Auto Schedule"])
async def get_auto_history(current_user: dict = Depends(get_current_user)): # 🔒 Bảo mật
    user_id = current_user["id"]
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    HISTORY_DB = os.path.join(BASE_DIR, "auto", "history.json")
    
    if os.path.exists(HISTORY_DB):
        with open(HISTORY_DB, "r", encoding="utf-8") as f:
            try:
                all_history = json.load(f)
                # Chỉ trả về lịch sử của user đang đăng nhập
                my_history = [h for h in all_history if h.get("user_id") == user_id]
                return list(reversed(my_history))
            except Exception:
                return []
    return []