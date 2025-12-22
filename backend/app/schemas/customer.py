import uuid
from pydantic import BaseModel, Field


class CustomerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    phone: str = Field(min_length=6, max_length=20)
    notes: str | None = None


class CustomerResponse(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    notes: str | None
