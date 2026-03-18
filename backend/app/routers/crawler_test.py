# FILE: backend/app/routers/crawler_test.py

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any
from fastapi.concurrency import run_in_threadpool
import requests
import urllib.parse
import re
from playwright.sync_api import sync_playwright

router = APIRouter()

# --- Định nghĩa Dữ liệu đầu vào ---
class CrawlTestPayload(BaseModel):
    name: str
    crawl_method: str  # "HTML", "BROWSER", "API", "REGEX"
    keyword: str = "công nghệ"
    url_template: Optional[str] = None
    post_item_sel: Optional[str] = None
    title_sel: Optional[str] = None
    api_method: Optional[str] = "GET"
    api_headers: Optional[Dict[str, str]] = None
    api_payload: Optional[Dict[str, Any]] = None
    regex_pattern: Optional[str] = None

# --- Hàm bóc tách JSON nội bộ ---
def extract_from_json(data, base_url):
    found = []
    def search_d(d):
        if isinstance(d, dict):
            t = d.get('title') or d.get('name')
            l = d.get('link') or d.get('url') or d.get('href')
            if t and l and isinstance(t, str) and isinstance(l, str) and len(t) > 10:
                if not l.startswith('http') and base_url: 
                    l = base_url.rstrip('/') + '/' + l.lstrip('/')
                found.append({"title": t, "url": l})
            for v in d.values(): search_d(v)
        elif isinstance(d, list):
            for item in d: search_d(item)
    search_d(data)
    return found

# --- Hàm Xử lý Lõi ---
def execute_crawl_method(payload: CrawlTestPayload):
    method = payload.crawl_method.upper()
    encoded_kw = urllib.parse.quote_plus(payload.keyword)
    target_url = payload.url_template.replace("{query}", encoded_kw) if payload.url_template else ""
    results = []

    try:
        # 1. NHÁNH API DIRECT
        if method == "API":
            headers = payload.api_headers or {}
            if payload.api_method.upper() == "POST":
                res = requests.post(target_url, headers=headers, json=payload.api_payload, timeout=10)
            else:
                res = requests.get(target_url, headers=headers, timeout=10)
            if res.status_code == 200:
                results = extract_from_json(res.json(), payload.url_template.split('/')[2] if target_url else "")
            else:
                return {"error": f"API lỗi {res.status_code}"}

        # 2. NHÁNH REGEX TEXT
        elif method == "REGEX":
            html_text = requests.get(target_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10).text
            matches = re.findall(payload.regex_pattern, html_text)
            for match in matches:
                url, title = match[0], match[1] 
                if not url.startswith("http"): url = "https://" + payload.url_template.split('/')[2] + url
                results.append({"title": title.strip(), "url": url.strip()})

        # 3. NHÁNH BROWSER DYNAMIC (Playwright + JS)
        elif method == "BROWSER":
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(target_url, wait_until="domcontentloaded", timeout=20000)
                page.wait_for_timeout(3000)
                page.evaluate("window.scrollBy(0, 1500)")
                page.wait_for_timeout(2000)
                
                items = page.locator(payload.post_item_sel).all()
                for item in items[:10]:
                    t_el = item.locator(payload.title_sel).first
                    if t_el.count() > 0:
                        t = t_el.inner_text().strip()
                        u = t_el.get_attribute("href")
                        if u and not u.startswith("http"): u = "https://" + payload.url_template.split('/')[2] + '/' + u.lstrip('/')
                        if t and u: results.append({"title": t, "url": u})
                browser.close()

        # 4. NHÁNH HTML STATIC (Nhanh, bỏ qua JS)
        elif method == "HTML":
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.route("**/*", lambda route: route.continue_() if route.request.resource_type in ["document"] else route.abort())
                page.goto(target_url, wait_until="domcontentloaded", timeout=15000)
                
                items = page.locator(payload.post_item_sel).all()
                for item in items[:10]:
                    t_el = item.locator(payload.title_sel).first
                    if t_el.count() > 0:
                        t = t_el.inner_text().strip()
                        u = t_el.get_attribute("href")
                        if u and not u.startswith("http"): u = "https://" + payload.url_template.split('/')[2] + '/' + u.lstrip('/')
                        if t and u: results.append({"title": t, "url": u})
                browser.close()
        else:
            return {"error": "Phương pháp không hợp lệ (Dùng: API, REGEX, BROWSER, HTML)"}

    except Exception as e:
        return {"error": f"Lỗi hệ thống: {str(e)}"}

    unique_res = list({v['url']:v for v in results}.values())
    return {
        "status": "success",
        "crawl_method": method,
        "total_found": len(unique_res),
        "data": unique_res[:5]
    }

# --- ENDPOINT API ---
@router.post("/test-crawl")
async def test_crawl_endpoint(payload: CrawlTestPayload):
    result = await run_in_threadpool(execute_crawl_method, payload)
    return result