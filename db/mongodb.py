from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "MONGO_DB_URI"

client = AsyncIOMotorClient(MONGO_URL)

db = client.infinity_pro_AI_auth_db

# collections
users_collection = db.users
tools_collection = db.tools
