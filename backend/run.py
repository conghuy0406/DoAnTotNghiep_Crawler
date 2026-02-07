import uvicorn
import sys
import asyncio

if __name__ == "__main__":
    # --- FIX LỖI WINDOWS ---
    # Ép buộc sử dụng ProactorEventLoop (Hỗ trợ Playwright) trước khi Server chạy
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        print("🔧 Đã kích hoạt chế độ Windows ProactorEventLoop cho Playwright")

    # Chạy Server
    print("🚀 Đang khởi động Server...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)