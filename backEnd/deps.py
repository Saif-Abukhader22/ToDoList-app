from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from auth_utils import decode_token  # we'll make this file next

# This tells FastAPI:
# "Tokens will be sent using OAuth2 Bearer in the header,
# and users can get them from /auth/login"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# Get a database session
def get_db():
    db = SessionLocal()  # make a new DB connection
    try:
        yield db          # give it to the route
    finally:
        db.close()        # close after request finishes


# Get the current logged-in user (from the token)
def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    payload = decode_token(token)  # will verify JWT and return data
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    email = payload["sub"]  # sub = subject = email in our case
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user
