# backend/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .validators import validate_password_or_400
from . import models, schemas
from .deps import get_db
from .schemas import UserCreate, UserLogin, UserOut, Token
from .auth_utils import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(body: UserCreate, db: Session = Depends(get_db)):
    validate_password_or_400(body.password)

    email = body.email.strip().lower()
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(email=email, hashed_password=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    return user   # Let FastAPI + Pydantic serialize it to JSON


@router.post("/login", response_model=Token)
def login(body: UserLogin, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}
