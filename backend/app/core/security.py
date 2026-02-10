from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:

    if plain_password and len(plain_password) > 72:
        plain_password = plain_password[:72]
        
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Mã hóa mật khẩu để lưu vào DB"""
    print(f"DEBUG PASSWORD: '{password}' - Length: {len(password)}")
    # --- FIX LỖI 72 BYTES ---
    # Bcrypt giới hạn input tối đa 72 bytes. 
    # Ta cắt ngắn xuống 72 ký tự để tránh crash server.
    if password and len(password) > 72:
        password = password[:72]
        
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Tạo ra chuỗi Token JWT"""
    to_encode = data.copy()
    
    # Sử dụng timezone.utc thay vì utcnow() (để tránh cảnh báo Deprecated)
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Nếu không truyền thời gian hết hạn, dùng mặc định từ config
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt