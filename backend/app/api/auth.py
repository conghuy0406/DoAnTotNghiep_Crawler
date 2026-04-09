from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestHeader
from datetime import timedelta
from app.core import security
from app.core.config import db
from app.schemas.user_schema import Token, UserCreate
from app.models.user import User

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user_in: UserCreate):
    user_exists = await db.users.find_one({"email": user_in.email})
    if user_exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = security.get_password_hash(user_in.password)
    new_user = {
        "email": user_in.email,
        "full_name": user_in.full_name,
        "role": user_in.role or "user",
        "hashed_password": hashed_password
    }
    result = await db.users.insert_one(new_user)
    
    access_token = security.create_access_token(
        data={"sub": user_in.email, "role": new_user["role"]}
    )
    return {"access_token": access_token, "token_type": "bearer", "role": new_user["role"]}

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestHeader = Depends()):
    user_data = await db.users.find_one({"email": form_data.username})
    if not user_data:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not security.verify_password(form_data.password, user_data["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Logic tự động nâng cấp Admin cho email cụ thể
    role = user_data.get("role", "user")
    if user_data["email"] == "admin@gmail.com" and role != "admin":
        role = "admin"
        await db.users.update_one({"_id": user_data["_id"]}, {"$set": {"role": "admin"}})
    
    access_token = security.create_access_token(
        data={"sub": user_data["email"], "role": role}
    )
    return {"access_token": access_token, "token_type": "bearer", "role": role}