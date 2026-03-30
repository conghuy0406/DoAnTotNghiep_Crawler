import json
import os
import urllib.parse
import time
from datetime import datetime
from celery import Celery

# Khởi tạo Celery
celery_app = Celery(
    "crawler_tasks",
    broker="redis://localhost:6379/0",     
    backend="redis://localhost:6379/0"     
)
celery_app.conf.timezone = 'Asia/Ho_Chi_Minh'

# =========================================================
# 1. NHỊP TIM HỆ THỐNG (CELERY BEAT) - CHẠY MỖI 1 PHÚT
# =========================================================
celery_app.conf.beat_schedule = {
    'heartbeat-every-minute': {
        'task': 'app.celery_worker.heartbeat_check_db',
        'schedule': 60.0,
    },
}

# =========================================================
# 2. HÀM KIỂM TRA DATABASE KHI NHỊP TIM ĐẬP
# =========================================================
@celery_app.task
def heartbeat_check_db():
    now = datetime.now()
    current_time = now.strftime("%H:%M")
    print(f"💓 [HEARTBEAT] Đập nhịp lúc {current_time}... Đang kiểm tra lịch trình")

    SCHEDULE_DB = "schedules.json"
    if not os.path.exists(SCHEDULE_DB):
        return

    # Đọc Database tạm (File JSON)
    with open(SCHEDULE_DB, "r", encoding="utf-8") as f:
        try:
            schedules = json.load(f)
        except:
            schedules = []

    # Quét xem có lịch nào trùng với giờ hiện tại không
    for schedule in schedules:
        if schedule.get("time") == current_time and schedule.get("is_active"):
            print(f"🚀 [AUTO MATCH] Đúng {current_time} rồi! Giao việc cào '{schedule['keyword']}' cho Worker ngay lập tức!")
            run_smart_crawl_task.delay(schedule["keyword"])


# =========================================================
# 3. ĐỘNG CƠ WORKER THỰC THI (PHIÊN BẢN CÀO THẬT)
# =========================================================
@celery_app.task(bind=True)
def run_smart_crawl_task(self, keyword: str):
    print(f"👷 [WORKER] Bắt đầu cào THẬT cho từ khóa: '{keyword}'")
    self.update_state(state='PROGRESS', meta={'current': 10, 'total': 100, 'status': 'Đang khởi động AI Crawler...'})

    try:
        # Import cục bộ (Tránh lỗi Circular Import)
        from app.main import run_smart_auto_crawl, SmartPayload

        # Xử lý URL
        encoded_kw = urllib.parse.quote_plus(keyword)
        target_url = f"https://timkiem.vnexpress.net/?q={encoded_kw}"

        self.update_state(state='PROGRESS', meta={'current': 40, 'total': 100, 'status': f'Đang phân tích trang: {target_url}...'})

        # Kích hoạt hàm cào thông minh
        result = run_smart_auto_crawl(SmartPayload(url=target_url))
        
        self.update_state(state='PROGRESS', meta={'current': 80, 'total': 100, 'status': 'Đang lưu vào Lịch sử...'})

        # ========================================================
        # ĐOẠN FIX LỖI: LƯU BẰNG ĐƯỜNG DẪN TUYỆT ĐỐI VÀO FOLDER auto
        # ========================================================
        import os
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        HISTORY_DIR = os.path.join(BASE_DIR, "auto")
        
        # Tự động tạo thư mục 'auto' nếu chưa có
        if not os.path.exists(HISTORY_DIR):
            os.makedirs(HISTORY_DIR)
            
        HISTORY_DB = os.path.join(HISTORY_DIR, "history.json")
        
        histories = []
        if os.path.exists(HISTORY_DB):
            with open(HISTORY_DB, "r", encoding="utf-8") as f:
                try: histories = json.load(f)
                except: pass

        new_history = {
            "task_id": self.request.id,
            "keyword": keyword,
            "time_completed": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_found": result.get("total_found", 0),
            "data": result.get("data", [])
        }
        histories.append(new_history)

        with open(HISTORY_DB, "w", encoding="utf-8") as f:
            json.dump(histories, f, ensure_ascii=False, indent=4)
        # ========================================================

        self.update_state(state='PROGRESS', meta={'current': 100, 'total': 100, 'status': 'Hoàn tất!'})
        print(f"✅ [WORKER] Cào thành công! Tìm thấy {result.get('total_found', 0)} bài viết. Đã lưu vào {HISTORY_DB}")
        
        return {"status": "success", "keyword": keyword, "total_found": result.get("total_found", 0), "data": result.get("data", [])}

    except Exception as e:
        print(f"❌ [WORKER] LỖI RỒI: {str(e)}")
        self.update_state(state='FAILURE', meta={'current': 0, 'total': 100, 'status': f'Lỗi hệ thống: {str(e)}'})
        return {"status": "error", "message": str(e)}