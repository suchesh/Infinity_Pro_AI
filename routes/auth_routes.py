from fastapi import APIRouter, HTTPException, Response, Cookie
from models.user import LoginRequest, SignupRequest
from auth.jwt import (
    hash_password,
    verify_password,
    create_access_token,
    verify_token
)
from db.mongodb import users_collection
from datetime import datetime

router = APIRouter()

# ===============================
# REGISTER
# ===============================
@router.post("/register")
async def register(user: SignupRequest):

    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = {
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "created_at": datetime.utcnow()
    }

    await users_collection.insert_one(new_user)

    return {
        "message": "User registered successfully"
    }


# ===============================
# LOGIN
# ===============================
@router.post("/login")
async def login(user: LoginRequest, response: Response):

    db_user = await users_collection.find_one({"email": user.email})

    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(db_user["_id"])})

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=1800,
        secure=False,      # True in production (HTTPS)
        samesite="lax"
    )

    return {"message": "Login successful"}


# ===============================
# LOGOUT
# ===============================
@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}


# ===============================
# PROTECTED ROUTE
# ===============================
@router.get("/protected")
async def protected_route(access_token: str = Cookie(None)):

    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = verify_token(access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")

    user = await users_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "message": "Access granted",
        "user_email": user["email"],
        "user_name": user["name"]
    }
