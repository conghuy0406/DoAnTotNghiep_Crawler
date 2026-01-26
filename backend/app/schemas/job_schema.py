from pydantic import BaseModel

# Quy định dữ liệu đầu vào (User gửi lên)
class JobCreate(BaseModel):
    url: str

# Quy định dữ liệu trả về (Server trả lời)
class JobResponse(JobCreate):
    id: str
    status: str