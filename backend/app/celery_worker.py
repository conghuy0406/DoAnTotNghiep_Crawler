from celery import Celery
from celery.schedules import crontab
import time

celery_app = Celery(
    "crawler_tasks",
    broker="redis://localhost:6379/0",     
    backend="redis://localhost:6379/0"     
)

# =========================================================
# 1. TASK CHẠY NGẦM DO NGƯỜI DÙNG BẤM NÚT (Đã làm hôm trước)
# =========================================================
@celery_app.task(bind=True)
def run_smart_crawl_task(self, url: str):
    total_steps = 100
    for i in range(total_steps):
        time.sleep(0.1) 
        self.update_state(state='PROGRESS', meta={'current': i, 'total': total_steps, 'status': 'Đang bóc tách dữ liệu...'})
        
    return {
        "status": "success", 
        "message": f"Đã cào xong URL: {url}",
        "data": [{"title": "Bài báo 1", "url": url}]
    }

# =========================================================
# 2. CẤU HÌNH ĐỒNG HỒ BÁO THỨC (CELERY BEAT SCHEDULER)
# =========================================================
# Cài đặt múi giờ Việt Nam để báo thức chạy chuẩn giờ
celery_app.conf.timezone = 'Asia/Ho_Chi_Minh'

celery_app.conf.beat_schedule = {
    # Hẹn giờ test: Chạy mỗi 30 giây một lần (Để xem kết quả cho nhanh)
    'test-crawl-every-30-seconds': {
        'task': 'app.celery_worker.scheduled_mass_crawl',
        'schedule': 30.0, 
        'args': ("Trí tuệ nhân tạo AI",) # Từ khóa tự động tìm kiếm
    },
    
    # Hẹn giờ thực tế: Chạy đúng 6h00 sáng mỗi ngày
    # 'daily-morning-crawl': {
    #     'task': 'app.celery_worker.scheduled_mass_crawl',
    #     'schedule': crontab(hour=6, minute=0),
    #     'args': ("Tin tức công nghệ",)
    # },
}

# =========================================================
# 3. TASK TỰ ĐỘNG CHẠY KHI ĐẾN GIỜ
# =========================================================
@celery_app.task
def scheduled_mass_crawl(keyword: str):
    """
    Khi đến giờ, hệ thống sẽ tự động nhảy vào đây.
    Ở đây bạn sẽ viết logic: Vào Database lấy các Nguồn đang bật -> Gọi Selenium/Regex -> Lưu vào Lịch sử.
    """
    print(f"⏰ [HỆ THỐNG AUTO] ĐẾN GIỜ RỒI! Đang tự động cào hàng loạt cho từ khóa: '{keyword}'")
    
    # Giả lập thời gian cào dữ liệu mất 5 giây
    time.sleep(5) 
    
    print(f"✅ [HỆ THỐNG AUTO] Đã cào xong và lưu vào Database cho từ khóa: '{keyword}'")
    return f"Hoàn thành tự động cào: {keyword}"