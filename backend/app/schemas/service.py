import uuid
from pydantic import BaseModel, Field


class ServiceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    price_paise: int = Field(ge=0)


class ServiceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    price_paise: int | None = Field(default=None, ge=0)
    active: bool | None = None


class ServiceResponse(BaseModel):
    id: uuid.UUID
    name: str
    price_paise: int
    active: bool
