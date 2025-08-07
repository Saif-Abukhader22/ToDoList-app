from pydantic import BaseModel

class TodoBase(BaseModel):
    title: str
    done: bool

class TodoCreate(TodoBase):
    pass

class Todo(TodoBase):
    id: int

    class Config:
        orm_mode = True
