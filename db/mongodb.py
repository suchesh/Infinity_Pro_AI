from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb+srv://suchesh:infi123@infinity-pro-ai-cluster.flx8byp.mongodb.net/infinity_pro_AI_auth_db?retryWrites=true&w=majority"

client = AsyncIOMotorClient(MONGO_URL)

db = client.infinity_pro_AI_auth_db

# collections
users_collection = db.users
tools_collection = db.tools