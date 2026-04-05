from re import A
from fastapi import (
    APIRouter,
    Request,
    Form,
    UploadFile,
    File,
    HTTPException,
    Depends
)

from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from datetime import datetime
from bson import ObjectId

from services.agents import Agent
from auth.dependencies import get_current_user
from models.user import CreateToolRequest
from db.mongodb import tools_collection

templates = Jinja2Templates(directory="templates")
router = APIRouter()
generator = Agent()



# --------------------------------
# 🔐 ALL ROUTES REQUIRE LOGIN
# --------------------------------

@router.get("/", response_class=HTMLResponse)
async def get_started(request: Request):
    return templates.TemplateResponse(
        "Get_Started.html",
        {"request": request}
    )

@router.get("/second_page", response_class=HTMLResponse)
async def second_page(
    request: Request,
    current_user: str = Depends(get_current_user)
):
    return templates.TemplateResponse(
        "Second_page.html",
        {"request": request, "user": current_user}
    )


@router.get("/parameters", response_class=HTMLResponse)
async def parameters(
    request: Request,
    current_user: str = Depends(get_current_user)
):
    return templates.TemplateResponse(
        "Parameters.html",
        {"request": request, "user": current_user}
    )


@router.get("/ai_tool", response_class=HTMLResponse)
async def ai_tool(
    request: Request,
    current_user: str = Depends(get_current_user)
):
    session = request.session

    return templates.TemplateResponse(
        "Ai_tool.html",
        {
            "request": request,
            "user": current_user,
            "modelname": session.get("modelname", "N/A"),
            "oneline": session.get("oneline", "N/A"),
            "ranges": session.get("ranges", "N/A"),
            "message": session.get("message", "N/A"),
            "selected_option": session.get("selectedOption", "N/A"),
            "prompt_history": session.get("prompt_history", [])
        }
    )


@router.get("/profile-page", response_class=HTMLResponse)
async def profile(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    return templates.TemplateResponse(
        "profile.html",
        {
            "request": request,
            "user": {
                "name": current_user.get("name"),
                "email": current_user.get("email"),
                "created_at": current_user.get("created_at")
            }
        }
    )

# --------------------------------
# JSON PROCESSING ROUTES
# --------------------------------

@router.post("/process_selection")
async def process_selection(
    request: Request,
    current_user: str = Depends(get_current_user)
):
    data = await request.json()

    required = ["modelname", "oneline", "ranges", "message", "selectedOption"]
    if not all(data.get(k) for k in required):
        raise HTTPException(status_code=400, detail="Missing required fields")

    request.session.update({
        "modelname": data["modelname"],
        "oneline": data["oneline"],
        "ranges": data["ranges"],
        "message": data["message"],
        "selectedOption": data["selectedOption"],
        "response": ""
    })

    return {"success": True}


@router.post("/process_form")
async def process_form(
    request: Request,
    current_user: str = Depends(get_current_user)
):
    data = await request.json()

    required = ["modelname", "oneline", "ranges", "message", "selectedOption"]
    if not all(data.get(k) for k in required):
        raise HTTPException(status_code=400, detail="Missing required fields")

    request.session.update({
        "modelname": data["modelname"],
        "oneline": data["oneline"],
        "ranges": data["ranges"],
        "message": data["message"],
        "selectedOption": data["selectedOption"],
        "response": ""
    })
    print("Data store in session successfully.")
    return {"message": "Stored successfully"}


# --------------------------------
# USER INPUT + FILE HANDLING
# --------------------------------

@router.post("/process_user_input")
async def process_user_input(
    request: Request,
    prompt: str | None = Form(None),
    context: str | None = Form(None),
    fileUploaded: UploadFile | None = File(None),
    fileUploaded1: UploadFile | None = File(None),
    fileUploaded2: UploadFile | None = File(None),
    current_user: str = Depends(get_current_user)
):
    selected_option = request.session.get("selectedOption")

    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    if selected_option in ["Image Agents", "RAG Applications", "Excel Sheet Analyzer"]:
        if not fileUploaded:
            raise HTTPException(status_code=400, detail="File not uploaded")

    if selected_option == "Multi Purpose Agent":
        if not fileUploaded1 or not fileUploaded2:
            raise HTTPException(status_code=400, detail="Files not uploaded")

    if selected_option == "Text-to-Text":
        response = generator.text2text(
            prompt,
            request.session["modelname"],
            request.session["message"],
            context
        )

    elif selected_option == "Image Agents":
        response = await generator.image2text(
            prompt,
            request.session["modelname"],
            request.session["message"],
            fileUploaded,
            context
        )

    elif selected_option == "RAG Applications":
        response = await generator.pdf2text(
            prompt,
            request.session["modelname"],
            request.session["message"],
            fileUploaded,
            context
        )

    elif selected_option == "Excel Sheet Analyzer":
        response = await generator.excel2text(
            prompt,
            request.session["modelname"],
            request.session["message"],
            fileUploaded,
            context
        )

    elif selected_option == "Multi Purpose Agent":
        response = await generator.excel_pdf2text(
            prompt,
            request.session["modelname"],
            request.session["message"],
            fileUploaded1,
            fileUploaded2,
            context
        )

    else:
        raise HTTPException(status_code=400, detail="Invalid selected option")

    request.session["response"] = response
    return response

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile information"""
    try:
        return {
            "name": current_user.get("name", current_user.get("email", "User").split("@")[0]),
            "email": current_user.get("email"),
            "created_at": current_user.get("created_at")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profile: {str(e)}")

# --------------------------------
# CUSTOM TOOLS MANAGEMENT
# --------------------------------

@router.post("/save_tool")
async def save_tool(
    tool: CreateToolRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Save a custom AI tool to the database"""
    try:
        user_id = str(current_user.get("_id"))
        print(f"\n🔧 [DEBUG] Saving tool for user: {user_id}")
        print(f"🔧 [DEBUG] Tool data: {tool.dict()}")
        
        tool_doc = {
            "user_id": user_id,
            "modelname": tool.modelname,
            "oneline": tool.oneline,
            "ranges": tool.ranges,
            "message": tool.message,
            "selectedOption": tool.selectedOption,
            "created_at": datetime.utcnow()
        }
        
        print(f"🔧 [DEBUG] Document to insert: {tool_doc}")
        print(f"🔧 [DEBUG] tools_collection object: {tools_collection}")
        
        result = await tools_collection.insert_one(tool_doc)
        print(f"✅ [DEBUG] Tool inserted successfully with ID: {result.inserted_id}")
        
        # Also store in session for immediate use
        request.session.update({
            "modelname": tool.modelname,
            "oneline": tool.oneline,
            "ranges": tool.ranges,
            "message": tool.message,
            "selectedOption": tool.selectedOption,
            "response": ""
        })
        
        return {
            "success": True,
            "tool_id": str(result.inserted_id),
            "message": "Tool saved successfully"
        }
    except Exception as e:
        print(f"❌ [ERROR] Failed to save tool: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error saving tool: {str(e)}")


@router.get("/user_tools")
async def get_user_tools(current_user: dict = Depends(get_current_user)):
    """Get all custom tools created by the current user"""
    try:
        user_id = str(current_user.get("_id"))
        print(f"\n🔧 [DEBUG] Fetching tools for user: {user_id}")
        
        tools = await tools_collection.find({
            "user_id": user_id
        }).sort("created_at", -1).to_list(length=100)
        
        print(f"🔧 [DEBUG] Found {len(tools)} tools in database")
        
        # Convert ObjectId to string for JSON serialization
        user_tools = []
        for tool in tools:
            user_tools.append({
                "id": str(tool["_id"]),
                "modelname": tool["modelname"],
                "oneline": tool["oneline"],
                "ranges": tool["ranges"],
                "message": tool["message"],
                "selectedOption": tool["selectedOption"],
                "created_at": tool["created_at"].isoformat() if isinstance(tool["created_at"], datetime) else tool["created_at"]
            })
        
        print(f"✅ [DEBUG] Returning {len(user_tools)} tools")
        return {"tools": user_tools}
    except Exception as e:
        print(f"❌ [ERROR] Failed to fetch tools: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching tools: {str(e)}")


@router.get("/load_tool/{tool_id}")
async def load_tool(
    tool_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Load a specific tool by ID and populate session"""
    try:
        # Validate ObjectId format
        try:
            obj_id = ObjectId(tool_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid tool ID")
        
        tool = await tools_collection.find_one({
            "_id": obj_id,
            "user_id": str(current_user.get("_id"))
        })
        
        if not tool:
            raise HTTPException(status_code=404, detail="Tool not found")
        
        # Populate session with tool configuration
        request.session.update({
            "modelname": tool["modelname"],
            "oneline": tool["oneline"],
            "ranges": tool["ranges"],
            "message": tool["message"],
            "selectedOption": tool["selectedOption"],
            "response": "",
            "tool_id": tool_id
        })
        
        return {
            "success": True,
            "tool": {
                "modelname": tool["modelname"],
                "oneline": tool["oneline"],
                "ranges": tool["ranges"],
                "message": tool["message"],
                "selectedOption": tool["selectedOption"]
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading tool: {str(e)}")