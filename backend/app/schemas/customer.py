import uuid
from datetime import date
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


class CustomerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    phone: str | None = Field(default=None, min_length=6, max_length=20)
    email: EmailStr | None = Field(default=None, max_length=254)
    dob: date | None = None
    gender: Literal["male", "female"] | None = None
    anniversary: date | None = None
    referral_source: str | None = Field(default=None, max_length=200)
    marketing_consent: bool = True
    whatsapp_opt_in: bool = True
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
    email: EmailStr | None
    dob: date | None
    gender: Literal["male", "female"] | None
    anniversary: date | None
    referral_source: str | None
    marketing_consent: bool
    whatsapp_opt_in: bool
    notes: str | None


class CustomerListResponse(BaseModel):
    items: list[CustomerResponse]
    page: int
    limit: int
    total: int
    has_more: bool


class CustomerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    phone: str | None = Field(default=None, min_length=6, max_length=20)
    email: EmailStr | None = Field(default=None, max_length=254)
    dob: date | None = None
    gender: Literal["male", "female"] | None = None
    anniversary: date | None = None
    referral_source: str | None = Field(default=None, max_length=200)
    marketing_consent: bool | None = None
    whatsapp_opt_in: bool | None = None
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
