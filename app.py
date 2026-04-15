from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
from starlette.middleware.sessions import SessionMiddleware
from routes.auth_routes import router as auth_router
from routes.protected_routes import router as protected_router

app = FastAPI()

# 🔐 Session middleware
app.add_middleware( 
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# 🔐 ADD THIS — NO EXCUSES
app.add_middleware(
    SessionMiddleware,
    secret_key="SUPER_SECRET_KEY_CHANGE_ME",
)
# 📁 Static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# 🔓 Public routes (login / register)
app.include_router(auth_router)

# 🔐 Protected routes
app.include_router(protected_router)

