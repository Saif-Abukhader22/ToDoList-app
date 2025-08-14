# like repository in dotnet 

from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

class User(BaseModel):
    id: int
    email: EmailStr

    class Config:
        from_attributes = True 

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    model_config = ConfigDict(from_attributes=True) 

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TodoBase(BaseModel):
    title: str
    done: bool = False

class TodoCreate(TodoBase):
    pass

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    done: Optional[bool] = None

class Todo(BaseModel):
    id: int
    title: str
    done: bool
    model_config = ConfigDict(from_attributes=True)  