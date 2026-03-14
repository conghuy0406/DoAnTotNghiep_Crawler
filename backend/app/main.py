# --- 1. FIX LỖI WINDOWS PLAYWRIGHT (BẮT BUỘC Ở DÒNG ĐẦU) ---
import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import crawl, auth, source, history, bookmarks, export 

# --- THƯ VIỆN BỔ SUNG CHO CHỨC NĂNG TEST CRAWL ---
import requests
import urllib.parse
import re
from playwright.sync_api import sync_playwright
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from fastapi.concurrency import run_in_threadpool
# ------------------------------------------------
from bs4 import BeautifulSoup
app = FastAPI()

# --- 2. CẤU HÌNH CORS ---
origins = [
    "http://localhost",
    "http://localhost:3000", 
    "http://localhost:5173", 
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
app.include_router(crawl.router, prefix="/api/v1", tags=["Crawl"])
app.include_router(source.router, prefix="/api/v1/sources", tags=["Source Config"])
app.include_router(history.router)
app.include_router(bookmarks.router)
app.include_router(export.router)
# --- (TẠM ẨN SCHEDULER ĐỂ TEST) ---
# @app.on_event("startup")
# async def startup_event():
#     from app.services.scheduler import start_scheduler
#     start_scheduler()

@app.get("/")
async def root():
    return {"message": "Backend API is Ready (Fixed Windows 100%)!"}


# =====================================================================
# CÁC CHỨC NĂNG CRAWL TÁCH BIỆT (MỖI PHƯƠNG PHÁP 1 API RIÊNG)
# Dùng để Test thử nghiệm trong Admin Panel
# =====================================================================

# --- HÀM BỔ TRỢ: Tự động bóc JSON ---
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

# ---------------------------------------------------------
# 1. CHỨC NĂNG CRAWL BẰNG API TRỰC TIẾP
# ---------------------------------------------------------
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
            return {"status": "success", "data": auto_extract_json(res.json())[:5]}
        return {"error": f"Lỗi HTTP {res.status_code}"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/v1/crawl-test/api", tags=["Test Crawl"])
async def test_crawl_api(payload: ApiPayload):
    return await run_in_threadpool(run_api_crawl, payload)


# ---------------------------------------------------------
# 2. CHỨC NĂNG CRAWL BẰNG BIỂU THỨC CHÍNH QUY (REGEX)
# ---------------------------------------------------------
class RegexPayload(BaseModel):
    url: str
    regex_pattern: str

def run_regex_crawl(data: RegexPayload):
    try:
        html_text = requests.get(data.url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10).text
        matches = re.findall(data.regex_pattern, html_text)
        
        results = []
        for match in matches[:5]:
            results.append({"match_data": match})
        return {"status": "success", "data": results}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/v1/crawl-test/regex", tags=["Test Crawl"])
async def test_crawl_regex(payload: RegexPayload):
    return await run_in_threadpool(run_regex_crawl, payload)


# ---------------------------------------------------------
# 3. CHỨC NĂNG CRAWL BẰNG TRÌNH DUYỆT (PLAYWRIGHT CHỜ JS)
# ---------------------------------------------------------
class BrowserPayload(BaseModel):
    url: str
    post_item_sel: str
    title_sel: str

def run_browser_crawl(data: BrowserPayload):
    results = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(data.url, wait_until="domcontentloaded", timeout=20000)
            page.wait_for_timeout(3000) # Cho JS chạy
            page.evaluate("window.scrollBy(0, 1500)") # Cuộn chuột
            page.wait_for_timeout(2000)
            
            items = page.locator(data.post_item_sel).all()
            for item in items[:5]:
                t_el = item.locator(data.title_sel).first
                if t_el.count() > 0:
                    results.append({
                        "title": t_el.inner_text().strip(),
                        "url": t_el.get_attribute("href")
                    })
            browser.close()
        return {"status": "success", "data": results}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/v1/crawl-test/browser", tags=["Test Crawl"])
async def test_crawl_browser(payload: BrowserPayload):
    return await run_in_threadpool(run_browser_crawl, payload)


# ---------------------------------------------------------
# 4. CHỨC NĂNG CRAWL HTML TĨNH (NHANH - BỎ QUA JS)
# ---------------------------------------------------------
class HtmlPayload(BaseModel):
    url: str
    post_item_sel: str
    title_sel: str

def run_html_crawl(data: HtmlPayload):
    results = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            # Chặn tải JS/Hình ảnh để chạy siêu tốc
            page.route("**/*", lambda route: route.continue_() if route.request.resource_type == "document" else route.abort())
            page.goto(data.url, wait_until="domcontentloaded", timeout=15000)
            
            items = page.locator(data.post_item_sel).all()
            for item in items[:5]:
                t_el = item.locator(data.title_sel).first
                if t_el.count() > 0:
                    results.append({
                        "title": t_el.inner_text().strip(),
                        "url": t_el.get_attribute("href")
                    })
            browser.close()
        return {"status": "success", "data": results}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/v1/crawl-test/html", tags=["Test Crawl"])
async def test_crawl_html(payload: HtmlPayload):
    return await run_in_threadpool(run_html_crawl, payload)

# =====================================================================
# 5. CHỨC NĂNG CRAWL THÔNG MINH (CHỈ CẦN QUĂNG LINK - HỆ THỐNG TỰ LO)
# =====================================================================

class SmartUrlPayload(BaseModel):
    url: str

# TỪ ĐIỂN CẤU HÌNH NGẦM (Lưu trữ class CSS của các trang phổ biến)
ECOMMERCE_KNOWLEDGE_BASE = {
    "tiki.vn": {
        "platform": "Tiki",
        "post_item_sel": "a.product-item",
        "title_sel": "div.name h3, div.name",
        "price_sel": "div.price-discount__price"
    },
    "shopee.vn": {
        "platform": "Shopee",
        "post_item_sel": "li.col-xs-2-4", 
        "title_sel": "div.ie3A-n, div[data-sqe='name']",
        "price_sel": "span.ZEgDH9, div[data-sqe='name'] ~ div span:nth-child(2)" 
    },
    "cellphones.com.vn": {
        "platform": "CellphoneS",
        "post_item_sel": "div.product-info-container",
        "title_sel": "div.product__name h3",
        "price_sel": "p.product__price--show"
    }
}

def run_smart_ecommerce_crawl(data: SmartUrlPayload):
    # 1. Tách lấy tên miền từ Link người dùng nhập
    try:
        domain = urllib.parse.urlparse(data.url).netloc.replace("www.", "")
    except Exception:
        return {"error": "Link không hợp lệ!"}

    # 2. Kiểm tra xem hệ thống có hỗ trợ trang này không
    if domain not in ECOMMERCE_KNOWLEDGE_BASE:
        return {"error": f"Hệ thống chưa hỗ trợ tự động cào cho '{domain}'. Vui lòng dùng tính năng cấu hình thủ công."}

    config = ECOMMERCE_KNOWLEDGE_BASE[domain]
    results = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(data.url, wait_until="domcontentloaded", timeout=25000)
            page.wait_for_timeout(3000) # Đợi JS load
            
            # Cuộn trang từ từ để load ảnh và giá (đặc thù của Shopee/Tiki)
            for _ in range(4):
                page.evaluate("window.scrollBy(0, 1000)")
                page.wait_for_timeout(1000)
            
            items = page.locator(config['post_item_sel']).all()
            for item in items[:10]: # Lấy tối đa 10 sản phẩm
                # Cào Tên Sản Phẩm
                title_el = item.locator(config['title_sel']).first
                title = title_el.inner_text().strip() if title_el.count() > 0 else ""
                
                # Cào Giá Sản Phẩm
                price_el = item.locator(config['price_sel']).first
                price = price_el.inner_text().strip() if price_el.count() > 0 else "Liên hệ"
                
                # Cào Link Sản Phẩm
                url = title_el.get_attribute("href") if title_el.count() > 0 else data.url
                if url and not url.startswith("http"):
                    url = f"https://{domain}/{url.lstrip('/')}"
                
                if title:
                    results.append({
                        "product_name": title,
                        "price": price,
                        "url": url,
                        "platform": config['platform']
                    })
            browser.close()
            
        return {
            "status": "success", 
            "platform_detected": config['platform'],
            "total_items": len(results),
            "data": results
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/v1/crawl-test/smart-auto", tags=["Test Crawl"])
async def test_smart_auto(payload: SmartUrlPayload):
    return await run_in_threadpool(run_smart_ecommerce_crawl, payload)


# =====================================================================
# 6. BỘ CÔNG CỤ CRAWL ĐA NĂNG MỚI (KIẾN TRÚC RAW DATA FETCHING)
# Backend làm phu khuân vác, Frontend làm phiên dịch
# =====================================================================


class UniversalCrawlPayload(BaseModel):
    method: str  # "HTML", "API", "SELENIUM", "REGEX"
    url_template: str  
    keyword: str
    
    # Chỉ cần selector của KHUNG BAO BỌC bên ngoài (Item wrapper)
    post_item_sel: Optional[str] = None 
    
    # Dành cho Regex
    regex_pattern: Optional[str] = None

# TRẠM ĐIỀU PHỐI - CHẾ ĐỘ LẤY DỮ LIỆU THÔ (RAW DATA)
def execute_universal_crawl(payload: UniversalCrawlPayload):
    method = payload.method.upper()
    encoded_kw = urllib.parse.quote_plus(payload.keyword)
    target_url = payload.url_template.replace("{query}", encoded_kw)
    results = []

    try:
        # --- CÁCH 1: HTML PARSING ---
        if method == "HTML":
            res = requests.get(target_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
            soup = BeautifulSoup(res.text, "html.parser")
            
            if not payload.post_item_sel:
                return {"error": "Thiếu post_item_sel để khoanh vùng dữ liệu HTML."}
                
            items = soup.select(payload.post_item_sel)
            for item in items[:5]: # Lấy thử 5 khối đầu tiên
                # BÊ NGUYÊN ĐOẠN HTML THÔ TRẢ VỀ CHO FRONTEND
                results.append({"raw_html_chunk": str(item)})

        # --- CÁCH 2: API REQUESTS ---
        elif method == "API":
            res = requests.get(target_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
            if res.status_code == 200:
                # TRẢ VỀ NGUYÊN CỤC JSON GỐC
                return {
                    "status": "success", 
                    "method_used": method,
                    "keyword": payload.keyword,
                    "data": res.json() 
                }
            else:
                return {"error": f"API lỗi HTTP {res.status_code}"}

        # --- CÁCH 3: SELENIUM / PLAYWRIGHT (CHẾ ĐỘ BIỂU DIỄN) ---
        elif method == "SELENIUM":
            if not payload.post_item_sel:
                return {"error": "Thiếu post_item_sel để khoanh vùng dữ liệu web động."}
                
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=False, slow_mo=500) 
                context = browser.new_context(viewport={'width': 1280, 'height': 720})
                page = context.new_page()
                
                page.goto(target_url, wait_until="domcontentloaded", timeout=20000)
                page.wait_for_timeout(2000)
                
                for _ in range(3):
                    page.evaluate("window.scrollBy(0, 500)")
                    page.wait_for_timeout(1000)
                
                items = page.locator(payload.post_item_sel).all()
                for item in items[:5]:
                    # Dùng JS nội bộ để moi nguyên đoạn mã HTML (outerHTML) của cái khung đó ra
                    raw_html = item.evaluate("el => el.outerHTML")
                    results.append({"raw_html_chunk": raw_html})
                        
                page.wait_for_timeout(2000)
                browser.close()

        # --- CÁCH 4: BIỂU THỨC CHÍNH QUY (REGEX) ---
        elif method == "REGEX":
            if not payload.regex_pattern:
                return {"error": "Thiếu biểu thức regex_pattern."}
                
            html_text = requests.get(target_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10).text
            matches = re.findall(payload.regex_pattern, html_text)
            
            for match in matches[:5]:
                # Trả về chuỗi Text đã bị cắt
                results.append({"raw_text_match": match})

        else:
            return {"error": "Phương pháp không hợp lệ! Vui lòng chọn HTML, API, SELENIUM, hoặc REGEX."}

        return {
            "status": "success", 
            "method_used": method,
            "keyword": payload.keyword,
            "total_found": len(results),
            "data": results
        }

    except Exception as e:
        return {"error": f"Lỗi hệ thống khi chạy mode {method}: {str(e)}"}

@app.post("/api/v1/crawl-test/execute-universal", tags=["Universal Crawl"])
async def run_universal_crawl_test(payload: UniversalCrawlPayload):
    return await run_in_threadpool(execute_universal_crawl, payload)