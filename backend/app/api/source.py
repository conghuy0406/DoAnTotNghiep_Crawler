from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from app.core.config import db
from typing import Dict, Optional, Any
import uuid
from datetime import datetime

# IMPORT CHÌA KHÓA BẢO MẬT
from app.api.auth import get_current_user

router = APIRouter()

class SourceConfig(BaseModel):
    name: str              
    base_url: str         
    search_url_template: str 
    is_active: bool = True 
    crawl_method: str = "HTML"
    is_global: Optional[bool] = False # 🌟 THÊM: Để hứng biến is_global từ Frontend gửi lên
    selectors: Optional[Dict[str, str]] = {
        "post_item": "h3.knswli-title", "title_link": "a",              
        "detail_title": "h1.kbwc-title", "detail_content": ".knc-content" 
    }
    regex_pattern: Optional[str] = None
    api_config: Optional[Dict[str, Any]] = {"method": "GET", "headers": {}, "body": {}}

class SourceConfigUpdate(BaseModel):
    name: Optional[str] = None
    base_url: Optional[str] = None
    search_url_template: Optional[str] = None
    is_active: Optional[bool] = None
    crawl_method: Optional[str] = None
    selectors: Optional[Dict[str, str]] = None
    regex_pattern: Optional[str] = None
    api_config: Optional[Dict[str, Any]] = None

# ==========================================
# 1. API GIEO HẠT DỮ LIỆU MẪU (CHẠY 1 LẦN)
# ==========================================
@router.post("/init-defaults")
async def init_default_sources():
    existing_sys_source = await db.websites.find_one({"is_system": True})
    if existing_sys_source:
        return {"message": "Dữ liệu mẫu đã tồn tại trong db.websites, không cần tạo thêm!", "status": "skipped"}

    default_sources = [
        {
            "_id": str(uuid.uuid4()),
            "name": "🔥 [Mẫu] VnExpress (Cào Web Tĩnh)",
            "base_url": "https://vnexpress.net",
            "search_url_template": "https://timkiem.vnexpress.net/?q={keyword}",
            "crawl_method": "HTML",
            "is_system": True,
            "is_global": True, # 🌟 Đồng bộ cờ
            "is_active": True,
            "selectors": {
                "post_item": ".item-news",
                "title_link": ".title-news a",
                "detail_title": "h1.title-detail",     
                "detail_content": "article.fck_detail" 
            },
            "created_at": datetime.now()
        },
        {
            "_id": str(uuid.uuid4()),
            "name": "🛒 [Mẫu] Shopee/Tiki (Cào Trình Duyệt)",
            "base_url": "https://shopee.vn",
            "search_url_template": "https://shopee.vn/search?keyword=laptop",
            "crawl_method": "SELENIUM",
            "is_system": True,
            "is_global": True,
            "is_active": True,
            "selectors": {
                "post_item": ".shopee-search-item-result__item",
                "title_link": ".yQmmFK",
                "price": ".vBmlHw",
                "thumbnail": "img"
            },
            "created_at": datetime.now()
        },
        {
            "_id": str(uuid.uuid4()),
            "name": "⚡ [Mẫu] Dữ liệu thô (API JSON)",
            "base_url": "https://jsonplaceholder.typicode.com",
            "search_url_template": "https://jsonplaceholder.typicode.com/posts",
            "crawl_method": "API",
            "is_system": True,
            "is_global": True,
            "is_active": True,
            "api_config": {
                "method": "GET",
                "headers": {},
                "body": {}
            },
            "created_at": datetime.now()
        },
        {
            "_id": str(uuid.uuid4()),
            "name": "🕵️ [Mẫu] Tìm Link VnExpress (Regex)",
            "base_url": "https://vnexpress.net",
            "search_url_template": "https://timkiem.vnexpress.net/?q=ai",
            "crawl_method": "REGEX",
            "is_system": True,
            "is_global": True,
            "is_active": True,
            "regex_pattern": 'href="(https://vnexpress\\.net/[^"#]+\\.html)".*?title="([^"]+)"',
            "created_at": datetime.now()
        }
    ]

    await db.websites.insert_many(default_sources)
    return {"message": "Đã gieo hạt thành công vào bảng websites!", "status": "success"}

# ==========================================
# 2. TẠO MỚI NGUỒN CỦA USER
# ==========================================
@router.post("/")
async def create_source(source: SourceConfig, current_user: dict = Depends(get_current_user)):
    new_source = source.dict()
    new_source["_id"] = str(uuid.uuid4())
    new_source["user_id"] = current_user["id"]
    
    # 🌟 KIỂM TRA QUYỀN: Ai được phép tạo nguồn chung?
    is_global_request = new_source.pop("is_global", False)
    
    # Nếu là ADMIN và có tích Checkbox "Mẫu hệ thống"
    if current_user.get("role") == "admin" and is_global_request:
        new_source["is_global"] = True
        new_source["is_system"] = True
    else:
        # User thường (Hoặc Admin không tích Checkbox)
        new_source["is_global"] = False
        new_source["is_system"] = False 

    new_source["created_at"] = datetime.now()
    new_source["updated_at"] = datetime.now()
    
    await db.websites.insert_one(new_source)
    return {"message": "Đã thêm cấu hình thành công!", "id": new_source["_id"]}

# ==========================================
# 3. LẤY DANH SÁCH NGUỒN (GỘP CHUNG LOGIC)
# ==========================================
@router.get("/")
async def get_sources(active_only: bool = False, current_user: dict = Depends(get_current_user)):
    try:
        user_role = current_user.get("role", "user")

        # 🌟 PHÂN QUYỀN ĐỌC DỮ LIỆU
        if user_role == "admin":
            base_query = {} # Admin được phép bế hết toàn bộ DB ra xem
        else:
            # User thường chỉ được xem của mình và của hệ thống
            base_query = {
                "$or": [
                    {"user_id": current_user["id"]},
                    {"is_system": True},
                    {"is_global": True}
                ]
            }
        
        query = base_query
        if active_only: 
            query = {
                "$and": [
                    {"is_active": True},
                    base_query
                ]
            }

        sources = await db.websites.find(query).to_list(length=200)
        
        for source in sources:
            source["_id"] = str(source["_id"])
            
        return sources
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# 4. CÁC API CHI TIẾT, CẬP NHẬT, XÓA
# ==========================================
@router.get("/{source_id}")
async def get_source_detail(source_id: str, current_user: dict = Depends(get_current_user)):
    user_role = current_user.get("role", "user")
    
    if user_role == "admin":
        source = await db.websites.find_one({"_id": source_id})
    else:
        source = await db.websites.find_one({
            "_id": source_id,
            "$or": [{"user_id": current_user["id"]}, {"is_system": True}, {"is_global": True}]
        })
        
    if not source: raise HTTPException(status_code=404, detail="Không tìm thấy nguồn")
    return source

@router.put("/{source_id}")
async def update_source(source_id: str, source_update: SourceConfigUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in source_update.dict(exclude_unset=True).items() if v is not None}
    if not update_data: raise HTTPException(status_code=400, detail="Không có dữ liệu")
    update_data["updated_at"] = datetime.now()

    # Admin sửa được mọi thứ, User chỉ sửa được của mình
    user_role = current_user.get("role", "user")
    query = {"_id": source_id} if user_role == "admin" else {"_id": source_id, "user_id": current_user["id"]}

    result = await db.websites.update_one(query, {"$set": update_data})
    
    if result.matched_count == 0: 
        raise HTTPException(status_code=403, detail="Không tìm thấy hoặc bạn không có quyền sửa Template này")
    return {"message": "Đã cập nhật thành công!"}

@router.delete("/{source_id}")
async def delete_source(source_id: str, current_user: dict = Depends(get_current_user)):
    # 🌟 LOGIC BẢO VỆ MỚI CHO LỆNH XÓA
    source = await db.websites.find_one({"_id": source_id})
    if not source: 
        raise HTTPException(status_code=404, detail="Không tìm thấy nguồn để xóa")

    # Kiểm tra xem ai đang bấm nút xóa
    is_admin = current_user.get("role") == "admin"
    is_owner = source.get("user_id") == current_user["id"]

    # Nếu không phải admin VÀ cũng không phải người tạo ra mẫu -> CÚT!
    if not is_admin and not is_owner:
        raise HTTPException(status_code=403, detail="Cảnh báo: Bạn không có quyền xóa Template của người khác hoặc mẫu của hệ thống!")

    await db.websites.delete_one({"_id": source_id})
    return {"message": "Đã xóa Template thành công."}