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
# Import hàm phân tích thông minh mới
from app.services.analyst import analyze_content_universal

FAKE_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

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
            # Lấy nội dung text
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
# 2. SEARCHER (HỖ TRỢ GOOGLE PROXY)
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
        print(f"   -> 🔎 [{source_name}] Tìm kiếm trực tiếp trên Dân Trí...")
    else:
        # --- SỬ DỤNG DUCKDUCKGO ĐỂ NÉ CAPTCHA CỦA GOOGLE ---
        use_proxy = True
        domain = base_url.replace("https://", "").replace("http://", "").replace("/", "")
        
        # Dùng DuckDuckGo phiên bản HTML (cực kỳ thân thiện với Bot)
        search_url = f"https://html.duckduckgo.com/html/?q=site:{domain}+{safe_keyword}"
        
        # Selector chuẩn của DuckDuckGo HTML
        post_item_sel = "div.result" 
        title_link_sel = "h2.result__title a"
        print(f"   -> 🔎 [{source_name}] Tìm kiếm qua DuckDuckGo Proxy (Chống Captcha)...")

    results = []
    page = context.new_page()
    
    try:
        print(f"      🔗 Truy cập: {search_url}")
        page.goto(search_url, timeout=30000, wait_until="domcontentloaded")
        
        # --- NẾU VẪN DÙNG GOOGLE, ĐÂY LÀ ĐOẠN DỪNG ĐỂ CLICK CAPTCHA BẰNG TAY ---
        # (Nếu bạn dùng DuckDuckGo thì đoạn này thường không bao giờ bị gọi tới)
        if "google.com" in search_url and page.locator('form[id="captcha-form"]').count() > 0:
            print("      ⚠️ PHÁT HIỆN GOOGLE CAPTCHA! Bạn có 15 giây để tự click vào ô 'I am not a robot' trên trình duyệt...")
            time.sleep(15) # Tạm dừng 15s chờ bạn giải cứu
        else:
            time.sleep(2) # Chờ load bình thường
            
        try:
            page.wait_for_selector(post_item_sel, timeout=5000)
        except:
            print(f"      ⚠️ Không tìm thấy bài viết (hoặc vẫn bị chặn).")
            return []

        items = page.locator(post_item_sel).all()
        print(f"      ✅ Tìm thấy {len(items)} kết quả thô.")
        
        for item in items:
            try:
                link_el = item.locator(title_link_sel).first

                if not link_el or not link_el.count(): 
                    continue

                title = link_el.inner_text().strip() or "No Title"
                href = link_el.get_attribute("href")

                if not href: continue
                
                # Giải mã URL nếu bị DuckDuckGo mã hóa (DuckDuckGo thường bọc link gốc qua url của họ)
                if "duckduckgo.com/l/?uddg=" in href:
                    import urllib.parse
                    # Tách lấy link gốc từ tham số uddg
                    parsed_url = urllib.parse.urlparse(href)
                    qs = urllib.parse.parse_qs(parsed_url.query)
                    if 'uddg' in qs:
                        href = qs['uddg'][0]

                # Bỏ link rác
                if "google.com" in href or "duckduckgo.com" in href: continue 
                
                # Xử lý link tương đối
                if href and not href.startswith("http"):
                    href = base_url + '/' + href.lstrip('/')
                
                # Bỏ qua Video/Podcast
                if any(x in href for x in ["/video", "/podcast", "/emagazine"]): continue

                # Xác nhận link đúng là của báo cần tìm
                if domain not in href and use_proxy:
                    continue

                results.append({
                    "source_name": source_name,
                    "title": title,
                    "url": href,
                    "selectors": config.get('selectors', {})
                })
            except Exception as e:
                # print("Lỗi item: ", e)
                continue
    except Exception as e:
        print(f"      ❌ Lỗi searcher: {e}")
    finally:
        page.close()
        
    return results

# ==========================================
# 3. ORCHESTRATOR (HÀM ĐIỀU PHỐI CHÍNH)
# ==========================================
def run_browser_sync(configs, keyword, limit):
    final_data = [] 
    valid_articles_for_ai = [] 
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent=FAKE_USER_AGENT, 
            viewport={"width": 1280, "height": 720}
        )
        
        # --- GIAI ĐOẠN 1: SEARCH ---
        all_links = []
        now = datetime.now()
        current_year = now.year        # 2026
        last_year = current_year - 1   # 2025
        
        print(f"\n🔎 Đang tìm kiếm: '{keyword}' (Chấp nhận tin {last_year}-{current_year})...")

        for conf in configs:
            raw_links = search_one_source_sync(context, conf, keyword, limit_pages=1)
            
            # --- BỘ LỌC THÔNG MINH ---
            clean_links = []
            years_to_block = [str(y) for y in range(2015, last_year)] 

            for item in raw_links:
                url = item.get('url', '')
                title = item.get('title', '').lower()
                keyword_lower = keyword.lower().strip()
                
                # 1. Lọc Năm
                is_too_old = False
                for y in years_to_block:
                    if f"/{y}/" in url or f"-{y}-" in url:
                        is_too_old = True
                        break
                if is_too_old: continue 

                # 2. Lọc Tiêu đề (Soft Match 20%)
                key_parts = keyword_lower.split()
                if len(key_parts) > 0:
                    match_count = sum(1 for part in key_parts if part in title)
                    match_ratio = match_count / len(key_parts)
                    if match_ratio < 0.2: 
                        continue

                clean_links.append(item)

            all_links.extend(clean_links)
            
        print(f"🚀 TỔNG LINK TÌM ĐƯỢC (ĐÃ LỌC): {len(all_links)}.")

        # --- TRỘN & CẮT ---
        random.shuffle(all_links)
        items_to_crawl = all_links[:5] 
        
        # --- GIAI ĐOẠN 2: CRAWL CHI TIẾT ---
        for item in items_to_crawl:
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
        print(f"\n🤖 Đang gửi {len(valid_articles_for_ai)} bài viết cho AI Đa Năng...")
        
        try:
            # GỌI HÀM PHÂN TÍCH UNIVERSAL
            ai_result = analyze_content_universal(valid_articles_for_ai, keyword)
            
            # Thêm metadata
            ai_result["keyword"] = keyword
            ai_result["created_at"] = datetime.now()
            ai_result["source_count"] = len(valid_articles_for_ai)
            
            # LƯU VÀO DB
            print("💾 Đang lưu kết quả vào Database...")
            try:
                client = MongoClient("mongodb://localhost:27017")
                db_sync = client.crawler_db
                # Lưu vào collection: universal_knowledge
                db_sync.universal_knowledge.insert_one(ai_result)
                
                # Fix ObjectId
                ai_result['_id'] = str(ai_result['_id'])
                client.close()
                print("✅ Đã lưu DB thành công.")
            except Exception as e:
                print(f"⚠️ Lỗi DB: {e}")
                if '_id' in ai_result: del ai_result['_id']

        except Exception as e:
            print(f"❌ Lỗi AI: {e}")

    # --- IN BÁO CÁO THÔNG MINH ---
    print("\n" + "="*60)
    print(f"🧠 BÁO CÁO THÔNG MINH: {keyword.upper()}")
    print("="*60)
    
    if ai_result:
        cat = ai_result.get("category", "General")
        sent = ai_result.get("sentiment", "Neutral")
        print(f"📂 Thể loại: {cat} | 🎭 Sắc thái: {sent}")
        print("-" * 60)
        print(f"📝 Tóm tắt:\n   {ai_result.get('summary')}")
        print("-" * 60)
        
        highlights = ai_result.get("key_highlights", [])
        if highlights:
            print("💡 Điểm nhấn:")
            for h in highlights: print(f"   - {h}")
            print("-" * 60)

        struct_data = ai_result.get("structured_data", [])
        if struct_data:
            print(f"📊 Dữ liệu chi tiết:")
            for item in struct_data:
                print(f"   • {item.get('label')}: {item.get('value')}")
    else:
        print("⚠️ Không có dữ liệu.")
    print("="*60 + "\n")

    return {
        "keyword": keyword,
        "analysis": ai_result,
        "raw_articles": final_data
    }

# ==========================================
# 4. HÀM WRAPPER & KHÁC
# ==========================================
async def search_by_config(keyword: str, selected_sources: list = None, limit: int = 5):
    query = {}
    if selected_sources: query["_id"] = {"$in": selected_sources}
    configs = await db.websites.find(query).to_list(length=100)
    if not configs: return []
    data = await run_in_threadpool(run_browser_sync, configs, keyword, limit)
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