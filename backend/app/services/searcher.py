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
# 0. HÀM CẬP NHẬT TIẾN TRÌNH VÀO DB
# ==========================================
def update_task_progress(task_id, progress, message):
    if not task_id: return
    try:
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
    
    print(f"      🕷️  [Worker] Đang bóc tách: {link_data['title'][:40]}...")
    page = context.new_page()
    try:
        page.goto(url, timeout=30000, wait_until="domcontentloaded")
        
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
# 2. SEARCHER (TÌM KIẾM TRỰC TIẾP & TƯƠNG TÁC)
# ==========================================
def search_one_source_sync(context, config, keyword, limit_pages=1):
    source_name = config.get('name', 'Unknown')
    base_url = config.get('base_url', '').rstrip('/')
    search_template = config.get('search_url_template', '')
    selectors = config.get('selectors', {})
    
    search_input_sel = selectors.get('search_input')
    search_button_sel = selectors.get('search_button')
    post_item_sel = selectors.get('post_item', 'article')
    title_link_sel = selectors.get('title_link', 'a')
    
    safe_keyword = quote(keyword.strip()) 
    use_proxy = False
    results = []
    page = context.new_page()
    
    try:
        # CÁCH 1: TƯƠNG TÁC (Gõ phím & Click)
        if search_input_sel:
            print(f"   -> 🔎 [{source_name}] Tương tác (Mở web, click, gõ phím)...")
            start_url = search_template if search_template else base_url
            page.goto(start_url, timeout=60000, wait_until="domcontentloaded")
            time.sleep(2)
            if search_button_sel:
                try:
                    page.locator(search_button_sel).first.click(timeout=5000)
                    time.sleep(1)
                except: pass
            try:
                page.locator(search_input_sel).first.fill(keyword)
                page.locator(search_input_sel).first.press("Enter")
                print(f"   -> ⌨️ Đã gõ chữ '{keyword}' và nhấn Enter.")
                time.sleep(4)
            except Exception as e:
                print(f"      ❌ Lỗi gõ từ khóa: {e}")
                return []
                
        # CÁCH 2: LINK TÌM KIẾM ĐỘNG
        elif "{keyword}" in search_template:
            search_query = safe_keyword.replace('%20', '+')
            search_url = search_template.replace("{keyword}", search_query)
            print(f"   -> 🚀 Đang load thẳng link: {search_url}")
            page.goto(search_url, timeout=60000, wait_until="load")
            time.sleep(3)

        # CÁCH 3: DÂN TRÍ HOẶC DUCKDUCKGO PROXY
        elif "dantri.com.vn" in base_url:
            search_url = f"https://dantri.com.vn/tim-kiem/{safe_keyword.replace('%20', '+')}.htm"
            post_item_sel = "article.article-item"
            title_link_sel = "h3.article-title a"
            page.goto(search_url, timeout=60000, wait_until="load")
            time.sleep(3)
        else:
            use_proxy = True
            domain = base_url.replace("https://", "").replace("http://", "").replace("/", "")
            search_url = f"https://html.duckduckgo.com/html/?q=site:{domain}+{safe_keyword}"
            post_item_sel = "div.result" 
            title_link_sel = "h2.result__title a"
            page.goto(search_url, timeout=60000, wait_until="load")
            time.sleep(3)
            
        # BÓC TÁCH LINK TỪ KẾT QUẢ
        try:
            page.wait_for_selector(post_item_sel, timeout=10000)
            items = page.locator(post_item_sel).all()
            print(f"   -> ✅ Giao diện đã load! Quét được {len(items)} khối chứa tin.")
        except:
            print(f"   -> ⚠️ Lỗi: Không tìm thấy khối bài viết nào (Tọa độ {post_item_sel} sai hoặc web trắng).")
            return []

        for item in items:
            try:
                link_el = item.locator(title_link_sel).first
                if not link_el or not link_el.count(): continue

                title = link_el.inner_text().strip()
                if not title: continue 
                
                href = link_el.get_attribute("href")
                if not href: continue
                
                if href and not href.startswith("http"):
                    href = base_url + '/' + href.lstrip('/')

                results.append({
                    "source_name": source_name,
                    "title": title,
                    "url": href,
                    "selectors": config.get('selectors', {})
                })
            except: continue
            
        print(f"   -> 📥 Lấy thành công {len(results)} link thô (đã có tiêu đề + url).")
    except Exception as e:
        print(f"      ❌ Lỗi trình duyệt: {e}")
    finally:
        page.close()
        
    return results

# ==========================================
# 3. ORCHESTRATOR (HÀM ĐIỀU PHỐI CHÍNH)
# ==========================================
def run_browser_sync(configs, keyword, limit, task_id=None):
    final_data = [] 
    valid_articles_for_ai = [] 
    
    update_task_progress(task_id, 10, f"Đang khởi động Bot để tìm '{keyword}'...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False) 
        context = browser.new_context(user_agent=FAKE_USER_AGENT, viewport={"width": 1280, "height": 720})
        
        all_links = []
        print(f"\n🔎 Đang thực thi tìm kiếm: '{keyword}'...")

        for conf in configs:
            raw_links = search_one_source_sync(context, conf, keyword, limit_pages=1)
            
            clean_links = []
            for item in raw_links:
                url = item.get('url', '')
                if not url or url == "#": continue
                # Đã loại bỏ bộ lọc ngày tháng và ký tự gắt gao
                clean_links.append(item)

            all_links.extend(clean_links)
            
        random.shuffle(all_links)
        items_to_crawl = all_links[:limit] 
        total_items = len(items_to_crawl)

        if total_items == 0:
            update_task_progress(task_id, 100, f"Mặc dù web đã load nhưng không trích xuất được link nào cho từ '{keyword}'.")
        else:
            update_task_progress(task_id, 30, f"Đã chốt {total_items} bài viết tốt nhất. Bắt đầu đọc chi tiết...")

        # --- GIAI ĐOẠN 2: CRAWL CHI TIẾT ---
        for i, item in enumerate(items_to_crawl):
            current_pct = 30 + int((i / max(total_items, 1)) * 40)
            update_task_progress(task_id, current_pct, f"Đang đọc nội dung {i+1}/{total_items}...")
            
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
        update_task_progress(task_id, 80, "Đang gửi dữ liệu cho AI phân tích...")
        print(f"\n🤖 Đang gửi {len(valid_articles_for_ai)} bài viết cho AI...")
        
        MAX_RETRIES = 3
        for attempt in range(MAX_RETRIES):
            try:
                ai_result = analyze_content_universal(valid_articles_for_ai, keyword)
                break 
            except Exception as e:
                error_msg = str(e)
                print(f"      ❌ Lỗi AI (Lần {attempt + 1}/{MAX_RETRIES}): {error_msg}")
                if "503" in error_msg or "UNAVAILABLE" in error_msg or "429" in error_msg:
                    if attempt < MAX_RETRIES - 1:
                        wait_time = 2 ** attempt 
                        print(f"      ⚠️ Gemini API đang quá tải. Đợi {wait_time}s rồi thử lại...")
                        time.sleep(wait_time)
                    else:
                        print("      ❌ Đã thử lại nhiều lần nhưng Gemini vẫn sập.")
                else:
                    break 
        
        if ai_result:
            try:
                ai_result["keyword"] = keyword
                ai_result["created_at"] = datetime.now()
                ai_result["source_count"] = len(valid_articles_for_ai)
                
                ai_result["raw_articles"] = valid_articles_for_ai

                update_task_progress(task_id, 90, "Đang lưu Báo cáo AI...")
                client = MongoClient("mongodb://localhost:27017")
                db_sync = client.crawler_db
                db_sync.universal_knowledge.insert_one(ai_result)
                ai_result['_id'] = str(ai_result['_id'])
                client.close()
                print("✅ Đã lưu Báo cáo vào DB.")
            except Exception as e:
                print(f"⚠️ Lỗi DB: {e}")
                if '_id' in ai_result: del ai_result['_id']

    update_task_progress(task_id, 95, "Hoàn tất!")
    
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
# 4. HÀM WRAPPER & CRAWL LINK TRỰC TIẾP
# ==========================================
async def search_by_config(keyword: str, selected_sources: list = None, limit: int = 5, task_id: str = None):
    query = {}
    if selected_sources: query["_id"] = {"$in": selected_sources}
    configs = await db.websites.find(query).to_list(length=100)
    if not configs: return []
    data = await run_in_threadpool(run_browser_sync, configs, keyword, limit, task_id)
    return data

def crawl_single_url(url: str):
    """Hàm này dùng để cào 1 đường link duy nhất (ĐÃ KHÔI PHỤC)"""
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