from fastapi import Request, HTTPException, status
from jose import jwt, JWTError
from core.congfig import SECRET_KEY, ALGORITHM
from fastapi import Cookie, HTTPException
from auth.jwt import verify_token
from db.mongodb import users_collection
from bson import ObjectId

async def get_current_user(access_token: str = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = verify_token(access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")

    user = await users_collection.find_one(
        {"_id": ObjectId(user_id)},
        {"password": 0}  # exclude password
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user["_id"] = str(user["_id"])
    return user

