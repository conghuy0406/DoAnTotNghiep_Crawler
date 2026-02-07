from pydantic import BaseModel, EmailStr

# Dùng khi User Đăng ký
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None

# Dùng để trả về thông tin User (Không trả về password!)
class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str | None = None
    
# Dùng để trả về Token
class Token(BaseModel):
    access_token: str
    token_type: str