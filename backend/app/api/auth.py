from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.core.config import db
from app.core.security import get_password_hash, verify_password, create_access_token, ALGORITHM, SECRET_KEY
from app.schemas.user_schema import UserCreate, UserResponse # Không cần import Token nữa
from jose import JWTError, jwt
import uuid

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# --- HÀM PHỤ TRỢ: Lấy User hiện tại từ Token ---
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token không hợp lệ hoặc đã hết hạn",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = await db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
        
    user["id"] = str(user["_id"])
    return user

# 🌟 HÀM PHÂN QUYỀN (RBAC): Dùng để khóa các API quan trọng
def require_role(allowed_roles: list[str]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role", "user") # Mặc định là user
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Bạn không có quyền thực hiện chức năng này!"
            )
        return current_user
    return role_checker

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate):
    existing_user = await db.users.find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email này đã được sử dụng")
    
    new_user = {
        "_id": str(uuid.uuid4()),
        "email": user_in.email,
        "hashed_password": get_password_hash(user_in.password),
        "full_name": user_in.full_name,
        "role": "user"  # 🌟 Mặc định user mới
    }
    await db.users.insert_one(new_user)
    new_user["id"] = new_user["_id"]
    return new_user

# 🌟 BỎ response_model=Token để có thể trả về thêm role và full_name
@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai email hoặc mật khẩu",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_role = user.get("role", "user") 
    access_token = create_access_token(data={"sub": user["email"], "role": user_role})
    
    # TRẢ VỀ TẤT CẢ THÔNG TIN CẦN THIẾT CHO REACT
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": user_role,
        "full_name": user.get("full_name", user["email"])
    }

# 🌟 BỎ response_model=UserResponse để không bị Pydantic cắt mất trường role
@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    current_user.pop("hashed_password", None) # Giấu password đi cho an toàn
    return current_user

# =====================================================================
# KHU VỰC DÀNH RIÊNG CHO ADMIN (QUẢN LÝ TÀI KHOẢN)
# =====================================================================
from pydantic import BaseModel

class RoleUpdate(BaseModel):
    role: str

@router.get("/admin/users", tags=["Admin"])
async def get_all_users(current_user: dict = Depends(require_role(["admin"]))):
    users = []
    cursor = db.users.find({}, {"hashed_password": 0}) 
    async for user in cursor: 
        user["id"] = str(user["_id"])
        users.append(user)
    return users

@router.put("/admin/users/{user_id}/role", tags=["Admin"])
async def update_user_role(user_id: str, data: RoleUpdate, current_user: dict = Depends(require_role(["admin"]))):
    if data.role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Quyền không hợp lệ!")
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Không thể tự thay đổi quyền của mình!")
    await db.users.update_one({"_id": user_id}, {"$set": {"role": data.role}})
    return {"status": "success", "message": f"Đã cập nhật quyền thành {data.role.upper()}"}

@router.delete("/admin/users/{user_id}", tags=["Admin"])
async def delete_user(user_id: str, current_user: dict = Depends(require_role(["admin"]))):
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Không thể tự xóa tài khoản của mình!")
    await db.users.delete_one({"_id": user_id})
    return {"status": "success"}