from pydantic import BaseModel, EmailStr

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class CreateToolRequest(BaseModel):
    modelname: str
    oneline: str
    ranges: str  # temperature value
    message: str  # description
    selectedOption: str  # tool type (Text-to-Text, Image Agents, etc.)

class ToolResponse(BaseModel):
    id: str
    modelname: str
    oneline: str
    ranges: str
    message: str
    selectedOption: str
    created_at: str

