from typing import List
from fastapi import FastAPI, Depends, HTTPException, status, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backEnd.database import Base, engine
from .schemas import Todo as TodoSchema, TodoCreate, TodoUpdate
from .auth import router as auth_router
from .deps import get_db, get_current_user
from . import models
from .database import engine, Base
from backEnd.schemas import User
from .models import Todo as TodoModel 
from fastapi.middleware.cors import CORSMiddleware

import os
import uvicorn

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://hammerhead-app-n3uaa.ondigitalocean.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],   # allow POST, OPTIONS, etc
    allow_headers=["*"],   # allow Content-Type, Authorization, etc
)




if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app", 
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8080))
    )

models.Base.metadata.create_all(bind=engine)
app.include_router(auth_router)

@app.get("/health")
def health():
    return {"ok": True}


@app.get("/todos", response_model=List[TodoSchema])
def get_todos(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return only the current user's todos."""
    rows = db.query(TodoModel).filter(TodoModel.user_id == user.id).all()
    # Return plain dicts (v1/v2 compatible)
    return [{"id": t.id, "title": t.title, "done": t.done} for t in rows]

@app.post("/todos", response_model=TodoSchema, status_code=status.HTTP_201_CREATED)
def add_todo(
    todo: TodoCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a todo for the current user."""
    new_todo = TodoModel(title=todo.title, done=todo.done, user_id=user.id)
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)

    return {"id": new_todo.id, "title": new_todo.title, "done": new_todo.done}

@app.patch("/todos/{todo_id}", response_model=TodoSchema)
def update_todo(
    todo_id: int,
    body: TodoUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update the current user's todo."""
    todo = db.query(TodoModel).filter(
        TodoModel.id == todo_id,
        TodoModel.user_id == user.id
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    if body.title is not None:
        todo.title = body.title
    if body.done is not None:
        todo.done = body.done

    db.commit()
    db.refresh(todo)
    # Return plain dict
    return {"id": todo.id, "title": todo.title, "done": todo.done}

@app.delete("/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Delete the current user's todo."""
    todo = db.query(TodoModel).filter(
        TodoModel.id == todo_id,
        TodoModel.user_id == user.id
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    db.delete(todo)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
