from sqlmodel import Field, SQLModel
from typing import Optional
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    streak_count: int = Field(default=0)
    last_active_date: Optional[datetime] = Field(default=None)
    daily_process_count: int = Field(default=0) # Tracks processes today for streak calculation

class UserCreate(SQLModel):
    username: str
    password: str

class UserRead(SQLModel):
    id: int
    username: str
    streak_count: int
    daily_process_count: int

class Token(SQLModel):
    access_token: str
    token_type: str
