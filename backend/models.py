from pydantic import BaseModel
from typing import Optional

class ExpenseCreate(BaseModel):
    amount: float
    description: str
    category: Optional[str] = None
    date: Optional[str] = None

class ChatMessage(BaseModel):
    message: str
    api_key: Optional[str] = None
    provider: Optional[str] = "smart_bot"

class ExpenseFilter(BaseModel):
    start: Optional[str] = None
    end: Optional[str] = None
    category: Optional[str] = None