# FILE: backend/app/services/searcher.py

from playwright.sync_api import sync_playwright
import time
import random
import trafilatura
from datetime import datetime
from pymongo import MongoClient
from urllib.parse import quote 
from fastapi.concurrency import run_in_threadpool

# --- IMPORT CONFIG & ANALYST ---
from app.core.config import db
from app.services.analyst import analyze_content_universal

FAKE_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# ==========================================
# [MỚI] HÀM CẬP NHẬT TIẾN TRÌNH VÀO DB
# ==========================================
def update_task_progress(task_id, progress, message):
    """
    Cập nhật phần trăm tiến trình vào MongoDB để Frontend hiển thị thanh loading.
    """
    if not task_id: return
    try:
        # Tạo kết nối DB độc lập cho luồng chạy ngầm
        client = MongoClient("mongodb://localhost:27017")
        client.crawler_db.tasks.update_one(
            {"_id": task_id}, 
            {"$set": {"progress": progress, "message": message}}
        )
        client.close()
    except Exception as e:
        print(f"⚠️ Lỗi update tiến trình: {e}")

# ==========================================
# 1. WORKER: CRAWL CHI TIẾT
# ==========================================
def crawl_detail_content(context, link_data):
    url = link_data['url']
    selectors = link_data.get('selectors', {})
    
    print(f"      🕷️  [Worker] Đang đọc: {link_data['title'][:30]}...")
    page = context.new_page()
    try:
        page.goto(url, timeout=30000, wait_until="domcontentloaded")
        
        # Ưu tiên selector cấu hình, nếu không có thì thử các selector phổ biến
        content_sel = selectors.get('detail_content')
        if not content_sel:
             content_sel = "article, .fck_detail, .singular-content, .content, body"

        try:
            full_content = page.locator(content_sel).first.inner_text().strip()
        except:
            full_content = ""
        
        link_data['crawled_content'] = full_content
        link_data['status'] = 'success'
        print(f"      ✅ OK ({len(full_content)} ký tự).")
    except Exception as e:
        print(f"      ❌ Lỗi worker: {e}")
        link_data['crawled_content'] = ""
        link_data['status'] = 'failed'
    finally:
        page.close()
    return link_data

# ==========================================
# 2. SEARCHER (DUCKDUCKGO & GOOGLE PROXY)
# ==========================================
def search_one_source_sync(context, config, keyword, limit_pages=1):
    source_name = config.get('name', 'Unknown')
    base_url = config.get('base_url', '').rstrip('/')
    safe_keyword = quote(keyword.strip()) 
    
    use_proxy = False
    
    if "dantri.com.vn" in base_url:
        search_url = f"https://dantri.com.vn/tim-kiem/{safe_keyword.replace('%20', '+')}.htm"
        post_item_sel = "article.article-item"
        title_link_sel = "h3.article-title a"
        print(f"   -> 🔎 [{source_name}] Tìm kiếm trực tiếp...")
    else:
        use_proxy = True
        domain = base_url.replace("https://", "").replace("http://", "").replace("/", "")
        search_url = f"https://html.duckduckgo.com/html/?q=site:{domain}+{safe_keyword}"
        post_item_sel = "div.result" 
        title_link_sel = "h2.result__title a"
        print(f"   -> 🔎 [{source_name}] Tìm kiếm qua DuckDuckGo Proxy...")

    results = []
    page = context.new_page()
    
    try:
        page.goto(search_url, timeout=30000, wait_until="domcontentloaded")
        time.sleep(2) 
            
        try:
            page.wait_for_selector(post_item_sel, timeout=5000)
        except:
            return []

        items = page.locator(post_item_sel).all()
        
        for item in items:
            try:
                link_el = item.locator(title_link_sel).first

                if not link_el or not link_el.count(): 
                    continue

                title = link_el.inner_text().strip() or "No Title"
                href = link_el.get_attribute("href")

                if not href: continue
                
                # Giải mã URL DuckDuckGo
                if "duckduckgo.com/l/?uddg=" in href:
                    import urllib.parse
                    parsed_url = urllib.parse.urlparse(href)
                    qs = urllib.parse.parse_qs(parsed_url.query)
                    if 'uddg' in qs:
                        href = qs['uddg'][0]

                # Bỏ link rác
                if "google.com" in href or "duckduckgo.com" in href: continue 
                
                if href and not href.startswith("http"):
                    href = base_url + '/' + href.lstrip('/')
                
                if any(x in href for x in ["/video", "/podcast", "/emagazine"]): continue

                if domain not in href and use_proxy:
                    continue

                results.append({
                    "source_name": source_name,
                    "title": title,
                    "url": href,
                    "selectors": config.get('selectors', {})
                })
            except:
                continue
    except Exception as e:
        print(f"      ❌ Lỗi searcher: {e}")
    finally:
        page.close()
        
    return results

# ==========================================
# 3. ORCHESTRATOR (HÀM ĐIỀU PHỐI CHÍNH)
# ==========================================
def run_browser_sync(configs, keyword, limit, task_id=None):
    final_data = [] 
    valid_articles_for_ai = [] 
    
    update_task_progress(task_id, 10, f"Đang khởi động Bot để tìm kiếm từ khóa '{keyword}'...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False) # Để False để bạn xem bot chạy
        context = browser.new_context(
            user_agent=FAKE_USER_AGENT, 
            viewport={"width": 1280, "height": 720}
        )
        
        all_links = []
        now = datetime.now()
        last_year = now.year - 1 
        
        print(f"\n🔎 Đang tìm kiếm: '{keyword}'...")

        for conf in configs:
            raw_links = search_one_source_sync(context, conf, keyword, limit_pages=1)
            
            clean_links = []
            years_to_block = [str(y) for y in range(2015, last_year)] 

            for item in raw_links:
                url = item.get('url', '')
                title = item.get('title', '').lower()
                keyword_lower = keyword.lower().strip()
                
                is_too_old = any(f"/{y}/" in url or f"-{y}-" in url for y in years_to_block)
                if is_too_old: continue 

                key_parts = keyword_lower.split()
                if key_parts:
                    match_count = sum(1 for part in key_parts if part in title)
                    if (match_count / len(key_parts)) < 0.2: continue

                clean_links.append(item)

            all_links.extend(clean_links)
            
        random.shuffle(all_links)
        items_to_crawl = all_links[:limit] 
        total_items = len(items_to_crawl)

        if total_items == 0:
            update_task_progress(task_id, 100, f"Không tìm thấy bài viết nào hợp lệ cho từ khóa '{keyword}'.")
        else:
            update_task_progress(task_id, 30, f"Đã tìm thấy {len(all_links)} bài. Bắt đầu đọc chi tiết {total_items} bài...")

        # --- GIAI ĐOẠN 2: CRAWL CHI TIẾT ---
        for i, item in enumerate(items_to_crawl):
            # Tính % tiến độ (Chạy từ 30% đến 70%)
            current_pct = 30 + int((i / max(total_items, 1)) * 40)
            update_task_progress(task_id, current_pct, f"Đang đọc nội dung bài viết {i+1}/{total_items}...")
            
            detailed_item = crawl_detail_content(context, item)
            final_data.append(detailed_item)
            
            if detailed_item.get('status') == 'success' and len(detailed_item.get('crawled_content', '')) > 100:
                valid_articles_for_ai.append(detailed_item)
            
            time.sleep(1)
            
        browser.close()

    # --- GIAI ĐOẠN 3: AI XỬ LÝ ĐA NĂNG ---
    ai_result = None

    if not valid_articles_for_ai:
        print("⚠️ Không có bài viết hợp lệ để phân tích.")
    else:
        update_task_progress(task_id, 80, "Đang gửi dữ liệu cho AI Đa Năng (Gemini) phân tích...")
        print(f"\n🤖 Đang gửi {len(valid_articles_for_ai)} bài viết cho AI...")
        
        try:
            ai_result = analyze_content_universal(valid_articles_for_ai, keyword)
            
            ai_result["keyword"] = keyword
            ai_result["created_at"] = datetime.now()
            ai_result["source_count"] = len(valid_articles_for_ai)
            
            update_task_progress(task_id, 90, "Đang lưu kết quả AI vào cơ sở dữ liệu...")
            try:
                client = MongoClient("mongodb://localhost:27017")
                db_sync = client.crawler_db
                db_sync.universal_knowledge.insert_one(ai_result)
                ai_result['_id'] = str(ai_result['_id'])
                client.close()
                print("✅ Đã lưu DB thành công.")
            except Exception as e:
                print(f"⚠️ Lỗi DB: {e}")
                if '_id' in ai_result: del ai_result['_id']

        except Exception as e:
            print(f"❌ Lỗi AI: {e}")

    # Báo cáo cuối cùng
    update_task_progress(task_id, 95, "Đang hoàn tất đóng gói dữ liệu...")
    
    # In Báo cáo ra Terminal
    print("\n" + "="*60)
    print(f"🧠 BÁO CÁO THÔNG MINH: {keyword.upper()}")
    print("="*60)
    if ai_result:
        print(f"📂 Thể loại: {ai_result.get('category')} | 🎭 Sắc thái: {ai_result.get('sentiment')}")
        print(f"📝 Tóm tắt:\n   {ai_result.get('summary')}")
    else:
        print("⚠️ Không có dữ liệu AI.")
    print("="*60 + "\n")

    return {
        "keyword": keyword,
        "analysis": ai_result,
        "raw_articles": final_data
    }

# ==========================================
# 4. HÀM WRAPPER & KHÁC
# ==========================================
async def search_by_config(keyword: str, selected_sources: list = None, limit: int = 5, task_id: str = None):
    query = {}
    if selected_sources: query["_id"] = {"$in": selected_sources}
    configs = await db.websites.find(query).to_list(length=100)
    if not configs: return []
    
    # Kích hoạt Playwright ngầm và truyền task_id
    data = await run_in_threadpool(run_browser_sync, configs, keyword, limit, task_id)
    return data

def crawl_single_url(url: str):
    print(f"🚀 [Direct Crawl] Đang truy cập: {url}")
    data = {}
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False) 
        context = browser.new_context(user_agent=FAKE_USER_AGENT)
        page = context.new_page()
        
        try:
            page.goto(url, timeout=30000, wait_until="domcontentloaded")
            html_content = page.content()
            extracted_text = trafilatura.extract(html_content, include_comments=False, include_tables=True)
            
            if extracted_text:
                content = extracted_text
                method = "Trafilatura"
            else:
                content = page.locator("body").inner_text()
                method = "Raw Body"

            data = {
                "url": url,
                "title": page.title(),
                "content": content.strip(),
                "extraction_method": method,
                "status": "success"
            }
            print(f"✅ Đã lấy được: {data['title'][:30]}... ({len(content)} ký tự)")
            
        except Exception as e:
            print(f"❌ Lỗi crawl link: {e}")
            data = {"url": url, "error": str(e), "status": "failed"}
        finally:
            browser.close()
            
    return data