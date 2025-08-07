 #SQLAlchemy to your database
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
#sessionmaker helps create a session — a temporary connection to run queries.
#eclarative_base is used to define models (tables) using Python classes.

DATABASE_URL = "postgresql://postgres:123456@localhost/todos_db"

engine = create_engine(DATABASE_URL) #create connection with DB

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False) # This builds a factory to create new Session objects.

Base = declarative_base()











