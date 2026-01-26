# File này chỉ lo việc cấu hình kết nối thôi
from motor.motor_asyncio import AsyncIOMotorClient # type: ignore
import redis

# Cấu hình MongoDB
MONGO_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client.crawler_db

# Cấu hình Redis
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)