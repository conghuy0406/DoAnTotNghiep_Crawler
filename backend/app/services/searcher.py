from playwright.sync_api import sync_playwright
import time
import random
from app.core.config import db
from fastapi.concurrency import run_in_threadpool
from app.services.analyst import extract_gold_data, calculate_average
from datetime import datetime
FAKE_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# ==========================================
# 1. WORKER: CRAWL CHI TIẾT
# ==========================================
def crawl_detail_content(context, link_data):
    url = link_data['url']
    selectors = link_data['selectors']
    print(f"      🕷️  [Worker] Đang đọc: {link_data['title'][:30]}...")
    page = context.new_page()
    try:
        page.goto(url, timeout=30000, wait_until="domcontentloaded")
        content_sel = selectors.get('detail_content', 'body')
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
# 2. SEARCHER (ĐA TRANG & FIX HREF)
# ==========================================
def search_one_source_sync(context, config, keyword, limit_pages=1):
    source_name = config.get('name', 'Unknown')
    print(f"   -> 🔎 [{source_name}] Bắt đầu tìm kiếm ({limit_pages} trang)...")
    
    results = []
    page = context.new_page()
    
    try:
        base_search_url_template = config['search_url_template']
        
        # --- VÒNG LẶP QUA CÁC TRANG ---
        # Giả sử ta crawl tối đa 'limit_pages' trang
        for current_page in range(1, limit_pages + 1):
            print(f"      📄 [{source_name}] Đang xử lý trang {current_page}...")
            
            # XỬ LÝ URL PHÂN TRANG
            # Logic: Nếu url có tham số page thì thay thế, nếu không thì chỉ chạy trang 1 rồi break
            # Với VnExpress/Dân Trí tìm kiếm, ta cần click hoặc sửa URL.
            # Ở đây ta dùng cách đơn giản nhất: Vào trang tìm kiếm -> Nhập liệu -> (Nếu trang > 1 thì click Next)
            
            if current_page == 1:
                # Trang 1: Vào URL gốc và nhập từ khóa
                page.goto(base_search_url_template, timeout=60000, wait_until="domcontentloaded")
                
                # Logic nhập liệu (Chỉ làm ở trang 1)
                search_btn = config['selectors'].get('search_button')
                input_sel = config['selectors'].get('search_input')
                
                if search_btn:
                    try: 
                        if page.locator(search_btn).first.is_visible(): page.click(search_btn); time.sleep(1)
                    except: pass
                
                try:
                    page.wait_for_selector(input_sel, state="attached", timeout=5000)
                    if page.locator(input_sel).first.is_visible():
                        page.click(input_sel); page.fill(input_sel, ""); page.type(input_sel, keyword, delay=50)
                    else:
                        page.evaluate(f"document.querySelector('{input_sel}').value='{keyword}';document.querySelector('{input_sel}').dispatchEvent(new Event('input'))")
                    page.keyboard.press("Enter"); time.sleep(3)
                except Exception as e:
                    print(f"      ❌ Lỗi nhập liệu: {e}")
                    break
            else:
                # Trang 2, 3...: Cần Logic Click nút "Trang tiếp" hoặc Next
                # (Hiện tại code này chưa hỗ trợ click Next tự động phức tạp, 
                # nên tạm thời chỉ chạy trang 1 cho ổn định trước đã)
                print("      ⚠️ Chức năng Next Page đang được phát triển. Dừng ở trang 1.")
                break

            # --- BÓC TÁCH DỮ LIỆU (FIX LỖI HREF RỖNG TẠI ĐÂY) ---
            sel = config['selectors']
            post_item_sel = sel.get('post_item')
            title_link_sel = sel.get('title_link')
            
            try:
                page.wait_for_selector(post_item_sel, timeout=10000)
            except:
                print(f"      ⚠️ Không thấy bài nào ở trang {current_page}.")
                break

            items = page.locator(post_item_sel).all()
            print(f"      ✅ Tìm thấy {len(items)} khung bài viết.")

            for i, item in enumerate(items):
                try:
                    # --- FIX QUAN TRỌNG: LUÔN TÌM THẺ A BÊN TRONG ---
                    link_el = item.locator(title_link_sel).first
                    
                    if not link_el.count():
                        # Fallback: Nếu không thấy thẻ a, thử tìm thẻ cha hoặc chính nó (ít khi xảy ra)
                        continue

                    title = link_el.inner_text().strip()
                    href = link_el.get_attribute("href")

                    if href and not href.startswith("http"):
                        href = config['base_url'].rstrip('/') + '/' + href.lstrip('/')
                    
                    if title and href:
                        results.append({
                            "source_name": source_name,
                            "title": title,
                            "url": href,
                            "selectors": config['selectors']
                        })
                except:
                    continue
            
            # Nếu chỉ lấy trang 1 thì break luôn
            if limit_pages == 1:
                break
            
            time.sleep(2) # Nghỉ giữa các trang

        print(f"      📦 Tổng kết [{source_name}]: Lấy được {len(results)} link.")
        page.close()
        return results
            
    except Exception as e:
        print(f"   ❌ Lỗi hệ thống [{source_name}]: {e}")
        try: page.close()
        except: pass
        return []

# ==========================================
# 3. ORCHESTRATOR
# ==========================================
def run_browser_sync(configs, keyword, limit):
    final_data = [] 
    valid_articles_for_ai = [] 
    
    with sync_playwright() as p:
        # 1. KHỞI TẠO TRÌNH DUYỆT
        browser = p.chromium.launch(
            headless=False, 
            args=["--disable-blink-features=AutomationControlled"]
        )
        context = browser.new_context(
            user_agent=FAKE_USER_AGENT, 
            viewport={"width": 1280, "height": 720}
        )
        
        # 2. GIAI ĐOẠN 1: SEARCH (TÌM LINK)
        all_links = []
        PAGES_TO_CRAWL = 1 # Chỉ quét trang 1 để demo cho nhanh
        
        for conf in configs:
            # Gọi hàm tìm kiếm (Searcher)
            links = search_one_source_sync(context, conf, keyword, limit_pages=PAGES_TO_CRAWL)
            all_links.extend(links)
            
        print(f"\n🚀 TỔNG LINK TÌM ĐƯỢC: {len(all_links)}.")

        # --- QUAN TRỌNG: TRỘN NGẪU NHIÊN LINK ---
        # Để đảm bảo lấy tin từ nhiều nguồn khác nhau, không bị dồn cục vào 1 báo
        random.shuffle(all_links)
        
        # Lấy tối đa 5 bài để phân tích
        items_to_crawl = all_links[:5] 
        print(f"👉 Hệ thống chọn ngẫu nhiên {len(items_to_crawl)} bài để đọc chi tiết...\n")

        # 3. GIAI ĐOẠN 2: CRAWL CHI TIẾT (WORKER)
        for item in items_to_crawl:
            # Gọi hàm đọc chi tiết
            detailed_item = crawl_detail_content(context, item)
            final_data.append(detailed_item)
            
            # Lọc bài lỗi hoặc bài quá ngắn (không đủ dữ liệu cho AI)
            if detailed_item.get('status') == 'success' and len(detailed_item.get('crawled_content', '')) > 100:
                valid_articles_for_ai.append(detailed_item)
                
            time.sleep(1) # Nghỉ 1s để tránh bị chặn IP
            
        browser.close()

    # 4. GIAI ĐOẠN 3: AI XỬ LÝ & LƯU DB (Nằm ngoài Playwright)
    
    market_summary = None
    ai_conclusion = ""

    if not valid_articles_for_ai:
        print("⚠️ Không có bài viết hợp lệ để phân tích.")
    else:
        print(f"\n🤖 Đang gửi {len(valid_articles_for_ai)} bài viết cho AI xử lý...")
        
        # Bước 3.1: Gọi AI trích xuất (Lấy Data + Lời bình)
        # Hàm này trả về dict: { "data": [...], "conclusion": "..." }
        ai_result = extract_gold_data(valid_articles_for_ai)
        
        extracted_list = ai_result.get("data", [])
        ai_conclusion = ai_result.get("conclusion", "Không có nhận định từ AI.")

        # Bước 3.2: Tính toán thống kê (Min, Max, Avg)
        print("📊 Đang tính toán thống kê...")
        market_summary = calculate_average(extracted_list)

        # Bước 3.3: Lưu vào MongoDB (Lịch sử giá)
        if market_summary:
            # Gán thêm dữ liệu bổ sung
            market_summary['ai_commentary'] = ai_conclusion
            market_summary['keyword'] = keyword
            market_summary['created_at'] = datetime.now()
            
            print("💾 Đang lưu kết quả vào Database...")
            try:
                # Dùng MongoClient sync để lưu nhanh trong luồng này
                # (Lưu ý: Đảm bảo MongoDB đang chạy ở cổng 27017)
                client_sync = MongoClient("mongodb://localhost:27017")
                db_sync = client_sync.crawler_db
                
                # Lưu vào collection 'price_history'
                db_sync.price_history.insert_one(market_summary)
                client_sync.close()
                print("✅ Đã lưu lịch sử thành công!")
            except Exception as e:
                print(f"⚠️ Lỗi khi lưu vào MongoDB: {e}")

        # --- IN BÁO CÁO RA MÀN HÌNH (CONSOLE REPORT) ---
        print("\n" + "="*60)
        print(f"💰 BÁO CÁO THỊ TRƯỜNG: {keyword.upper()} (AI POWERED)")
        print("="*60)
        
        if market_summary:
            print(f"🔥 NHẬN ĐỊNH CHUYÊN GIA:")
            print(f"   \"{ai_conclusion}\"")
            print("-" * 60)
            print(f"📈 Giá trung bình: {market_summary.get('average_price')} Triệu/lượng")
            print(f"📉 Biên độ giá:   {market_summary.get('min_price')} - {market_summary.get('max_price')} Triệu")
            print(f"🔍 Dựa trên:      {market_summary.get('data_points')} nguồn tin")
            print("-" * 60)
            print("Chi tiết các nguồn ghi nhận:")
            for d in market_summary.get('details', []):
                print(f" • [{d.get('source')}] {d.get('gold_type', 'Vàng')}: {d.get('price')} ({d.get('trend')})")
        else:
            print("⚠️ Không đủ dữ liệu số để lập báo cáo chi tiết.")
            print(f"💡 AI Nhận định sơ bộ: \"{ai_conclusion}\"")
            
        print("="*60 + "\n")

    # 5. TRẢ VỀ KẾT QUẢ CHO API
    return {
        "keyword": keyword,
        "market_summary": market_summary, # Object chứa giá & thống kê
        "ai_conclusion": ai_conclusion,   # Lời bình luận của AI
        "raw_articles": final_data        # Danh sách bài báo gốc
    }

async def search_by_config(keyword: str, selected_sources: list = None, limit: int = 5):
    query = {}
    if selected_sources: query["_id"] = {"$in": selected_sources}
    configs = await db.websites.find(query).to_list(length=100)
    if not configs: return []
    data = await run_in_threadpool(run_browser_sync, configs, keyword, limit)
    return data