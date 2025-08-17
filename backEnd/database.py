 #SQLAlchemy to your database
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

#sessionmaker helps create a session — a temporary connection to run queries.
#eclarative_base is used to define models (tables) using Python classes.

DATABASE_URL = os.getenv("DATABASE_URL")


if not DATABASE_URL:
    DATABASE_URL = "postgresql+psycopg2://postgres:123456@localhost/todos_db"

    print("🚀 Using database:", DATABASE_URL)


engine = create_engine(DATABASE_URL, pool_pre_ping=True) #create connection with DB

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False) # This builds a factory to create new Session objects.

Base = declarative_base()
