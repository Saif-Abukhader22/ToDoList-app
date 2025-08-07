from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Todo  # ✅ SQLAlchemy model
from schemas import Todo as TodoSchema  # ✅ Pydantic schema for response
from pydantic import BaseModel
from typing import List
from schemas import TodoCreate  
from fastapi.middleware.cors import CORSMiddleware
#Cross-Origin Resource Sharing : If your frontend and backend run on different origins 
#(domains or ports), the browser won’t let them talk unless the backend says it's allowed.

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()




# In-memory list to store todos
todos: List[Todo] = [] 

# Route to get all todos
@app.get("/todos", response_model=List[TodoSchema])
def get_todos(db: Session = Depends(get_db)):
    return db.query(Todo).all()

# Route to add a todo

@app.post("/todos", response_model=TodoSchema)
def add_todo(todo: TodoCreate, db: Session = Depends(get_db)):
    new_todo = Todo(title=todo.title, done=todo.done)
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)
    return new_todo

@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if todo:
        db.delete(todo)
        db.commit()
        return {"message": "Deleted"}
    return {"error": "Todo not found"}

@app.patch("/todos/{todo_id}")
def update_todo(todo_id: int, updated: TodoSchema, db: Session = Depends(get_db)):
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if todo:
        todo.title = updated.title
        todo.done = updated.done
        db.commit()
        db.refresh(todo)
        return todo
    return {"error": "Todo not found"}

