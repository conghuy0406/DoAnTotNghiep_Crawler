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
from app.celery_worker import run_smart_crawl_task, celery_app

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


@app.get("/")
async def root():
    return {"message": "Backend API is Ready (Fixed Windows 100%)!"}


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
            
            # KẾ HOẠCH DỰ PHÒNG (FALLBACK):
            if len(extracted_data) > 0:
                return {"status": "success", "data": extracted_data}
            else:
                return {"status": "success", "data": raw_json}
                
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


class BrowserPayload(BaseModel):
    url: str
    post_item_sel: Optional[str] = None
    title_sel: Optional[str] = None

# TỪ ĐIỂN CÁC TRANG WEB KHÓ (Bot sẽ tự nhớ Selector mà không cần người dùng nhập)
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

def run_browser_crawl(data: BrowserPayload):
    results = []
    try:
        # 1. Tự động nhận diện tên miền trang web
        domain = urllib.parse.urlparse(data.url).netloc.replace("www.", "")
        
        # 2. Xử lý logic Lai (Hybrid Logic)
        actual_post_sel = data.post_item_sel
        actual_title_sel = data.title_sel
        mode_used = "MANUAL_OVERRIDE" # Mặc định là người dùng tự nhập
        
        # Nếu người dùng ĐỂ TRỐNG 2 ô Selector
        if not actual_post_sel or not actual_title_sel:
            # Kiểm tra xem web này có nằm trong Từ điển không
            if domain in KNOWN_SITES:
                actual_post_sel = KNOWN_SITES[domain]["post_item_sel"]
                actual_title_sel = KNOWN_SITES[domain]["title_sel"]
                mode_used = f"AUTO_SMART_DICT ({domain})"
            else:
                mode_used = "AUTO_HEURISTIC_NEWS" # Nếu là web lạ/báo chí, dùng AI tự đoán

        with sync_playwright() as p:
            # Vượt rào cơ bản
            browser = p.chromium.launch(headless=False, args=['--disable-blink-features=AutomationControlled'])
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={'width': 1920, 'height': 1080}
            )
            page = context.new_page()
            
            page.goto(data.url, wait_until="domcontentloaded", timeout=25000)
            page.wait_for_timeout(3000)
            
            # Cuộn trang để tải ảnh/JS
            for _ in range(3):
                page.evaluate("window.scrollBy(0, 1000)")
                page.wait_for_timeout(1500)
            
            # --- PHÂN NHÁNH XỬ LÝ ---
            
            # NHÁNH A: DÙNG SELECTOR (Cho Shopee, Tiki hoặc người dùng tự nhập)
            if actual_post_sel and actual_title_sel:
                items = page.locator(actual_post_sel).all()
                for item in items[:10]:
                    t_el = item.locator(actual_title_sel).first
                    if t_el.count() > 0:
                        title_text = t_el.inner_text().strip()
                        url_link = t_el.get_attribute("href")
                        
                        # Xử lý link bị thiếu https://
                        if url_link and not url_link.startswith("http"):
                             url_link = f"https://{domain}{url_link}"
                             
                        if title_text:
                            results.append({"title": title_text, "url": url_link or data.url})
                        
            # NHÁNH B: CÀO MÙ CHO BÁO CHÍ (AUTO HEURISTIC)
            else:
                links = page.locator("a").all()
                seen_urls = set()
                
                for link in links:
                    try:
                        raw_text = link.inner_text().strip()
                        url = link.get_attribute("href")
                        if not url or not raw_text: continue
                            
                        # Cắt dòng và tìm dòng dài nhất làm Tiêu đề
                        lines = [line.strip() for line in raw_text.split('\n') if len(line.strip()) > 10]
                        if not lines: continue
                        best_title = max(lines, key=len)
                        
                        if len(best_title) > 20 and url not in seen_urls:
                            if not url.startswith("http"):
                                url = f"https://{domain}{url}"
                            results.append({"title": best_title, "url": url})
                            seen_urls.add(url)
                            
                        if len(results) >= 10: break
                    except Exception:
                        continue

            browser.close()
            
        return {
            "status": "success", 
            "mode": mode_used, 
            "total_found": len(results),
            "data": results
        }
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
# 5. CHỨC NĂNG CRAWL THÔNG MINH (CÂN MỌI THỂ LOẠI LINK)
# =====================================================================
class SmartPayload(BaseModel):
    url: str

SMART_KNOWLEDGE_BASE = {
    "shopee.vn": {
        "post_item_sel": "li.col-xs-2-4, .shopee-search-item-result__item",
        "title_sel": "div[data-sqe='name'], div.ie3A-n"
    },
    "tiki.vn": {
        "post_item_sel": "a.product-item",
        "title_sel": "div.name h3, div.name"
    },
    "vnexpress.net": {
        "post_item_sel": "article.item-news",
        "title_sel": "h3.title-news a"
    }
}

def run_smart_auto_crawl(data: SmartPayload):
    results = []
    try:
        domain = urllib.parse.urlparse(data.url).netloc.replace("www.", "")
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--disable-blink-features=AutomationControlled'])
            context = browser.new_context(viewport={'width': 1920, 'height': 1080}, user_agent="Mozilla/5.0")
            page = context.new_page()
            
            page.goto(data.url, wait_until="domcontentloaded", timeout=25000)
            page.wait_for_timeout(3000)
            
            for _ in range(3):
                page.evaluate("window.scrollBy(0, 800)")
                page.wait_for_timeout(1000)

            # CHIẾN THUẬT 1: DÙNG TỪ ĐIỂN
            if domain in SMART_KNOWLEDGE_BASE:
                mode = f"SMART_DICT_MATCH ({domain})"
                post_sel = SMART_KNOWLEDGE_BASE[domain]["post_item_sel"]
                title_sel = SMART_KNOWLEDGE_BASE[domain]["title_sel"]
                
                items = page.locator(post_sel).all()
                for item in items[:10]:
                    t_el = item.locator(title_sel).first
                    if t_el.count() > 0:
                        title_text = t_el.inner_text().strip()
                        url_link = t_el.get_attribute("href")
                        
                        if url_link and not url_link.startswith("http"):
                            url_link = f"https://{domain}{url_link}"
                            
                        if title_text:
                            results.append({"title": title_text, "url": url_link or data.url})
            
            # CHIẾN THUẬT 2: AI TỰ ĐOÁN
            else:
                mode = f"SMART_AI_GUESS (Unknown Site: {domain})"
                links = page.locator("a").all()
                seen_urls = set()
                
                for link in links:
                    try:
                        raw_text = link.inner_text().strip()
                        url_link = link.get_attribute("href")
                        
                        if not url_link or not raw_text: continue
                            
                        lines = [line.strip() for line in raw_text.split('\n') if len(line.strip()) > 10]
                        if not lines: continue
                            
                        best_title = max(lines, key=len)
                        
                        if len(best_title) > 20 and url_link not in seen_urls:
                            if not url_link.startswith("http"):
                                url_link = f"https://{domain}{url_link}"
                            results.append({"title": best_title, "url": url_link})
                            seen_urls.add(url_link)
                            
                        if len(results) >= 10: break
                    except Exception:
                        continue

            browser.close()
            
        return {"status": "success", "mode": mode, "total_found": len(results), "data": results}
        
    except Exception as e:
        return {"error": f"Lỗi khi chạy Smart Auto: {str(e)}"}

@app.post("/api/v1/crawl-test/smart-auto", tags=["Test Crawl"])
async def test_smart_auto(payload: SmartPayload):
    return await run_in_threadpool(run_smart_auto_crawl, payload)


# =====================================================================
# 6. BỘ CÔNG CỤ CRAWL ĐA NĂNG MỚI (KIẾN TRÚC RAW DATA FETCHING)
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
async def run_universal_crawl_test(payload: UniversalCrawlPayload):
    return await run_in_threadpool(execute_universal_crawl, payload)

# =====================================================================
# 7. CHỨC NĂNG CELERY TASK QUEUE (HÀNG ĐỢI BẤT ĐỒNG BỘ)
# =====================================================================
from pydantic import BaseModel

class StartTaskPayload(BaseModel):
    url: str

# API 1: Giao việc (Nhận url từ Body thay vì Query Params để bảo mật hơn)
@app.post("/api/v1/tasks/start-crawl", tags=["Task Queue"])
async def start_crawl_task(payload: StartTaskPayload):
    # Giao việc cho Celery
    task = run_smart_crawl_task.delay(payload.url)
    return {"status": "Processing", "task_id": task.id}

# API 2: Hỏi thăm tiến độ
@app.get("/api/v1/tasks/{task_id}", tags=["Task Queue"])
async def get_task_status(task_id: str):
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