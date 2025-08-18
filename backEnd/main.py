# backEnd/main.py
from typing import List
import os
import uvicorn

from fastapi import FastAPI, Depends, HTTPException, status, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base
from . import models
from .models import Todo as TodoModel
from .schemas import Todo as TodoSchema, TodoCreate, TodoUpdate
from .auth import router as auth_router
from .deps import get_db, get_current_user
from backEnd.schemas import User  # your Pydantic UserOut/User type

app = FastAPI()

ALLOWED_ORIGINS = [
    "https://starfish-app-ms4wl.ondigitalocean.app",  # <-- your React site
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],   # POST/GET/PATCH/DELETE/OPTIONS
    allow_headers=["*"],   # let browser send content-type, authorization, etc.
    max_age=86400,
)

# optional: guarantee any stray OPTIONS returns 204 so preflight can't 400
@app.options("/{path:path}")
def cors_preflight(path: str):
    return Response(status_code=204)

# --- DB + routers ---
models.Base.metadata.create_all(bind=engine)
app.include_router(auth_router)

@app.get("/health")
def health():
    return {"ok": True}

# -------- Todos API --------
@app.get("/todos", response_model=List[TodoSchema])
def get_todos(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = db.query(TodoModel).filter(TodoModel.user_id == user.id).all()
    return [{"id": t.id, "title": t.title, "done": t.done} for t in rows]

@app.post("/todos", response_model=TodoSchema, status_code=status.HTTP_201_CREATED)
def add_todo(
    todo: TodoCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    new_todo = TodoModel(title=todo.title, done=todo.done, user_id=user.id)
    db.add(new_todo); db.commit(); db.refresh(new_todo)
    return {"id": new_todo.id, "title": new_todo.title, "done": new_todo.done}

@app.patch("/todos/{todo_id}", response_model=TodoSchema)
def update_todo(
    todo_id: int,
    body: TodoUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    todo = db.query(TodoModel).filter(
        TodoModel.id == todo_id, TodoModel.user_id == user.id
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if body.title is not None:
        todo.title = body.title
    if body.done is not None:
        todo.done = body.done
    db.commit(); db.refresh(todo)
    return {"id": todo.id, "title": todo.title, "done": todo.done}

@app.delete("/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    todo = db.query(TodoModel).filter(
        TodoModel.id == todo_id, TodoModel.user_id == user.id
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(todo); db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# For local runs only; DO uses its own run command.
if __name__ == "__main__":
    uvicorn.run("backEnd.main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
