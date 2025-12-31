import uuid
from pydantic import BaseModel, Field, field_validator


class CustomerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    phone: str | None = Field(default=None, min_length=6, max_length=20)
    notes: str | None = None

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_phone(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            s = v.strip()
            return s or None
        return v


class CustomerResponse(BaseModel):
    id: uuid.UUID
    name: str
    phone: str | None
    notes: str | None
