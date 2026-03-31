# File này chỉ lo việc cấu hình kết nối thôi
from motor.motor_asyncio import AsyncIOMotorClient # type: ignore
import redis

# Cấu hình MongoDB
MONGO_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client.crawler_db

# Cấu hình Redis
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Cấu hình bảo mật (Thêm vào dưới cùng)
SECRET_KEY = "doantotnghiep_sieu_bao_mat_2024" # Thực tế nên để chuỗi ngẫu nhiên dài
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # Token hết hạn sau 30 phút
GOOGLE_API_KEY="AIzaSyArGWQ2qtG8PfUIEobzx25imG99DsLTaPY"
