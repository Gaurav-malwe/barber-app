import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class InvoiceItemCreate(BaseModel):
    service_id: uuid.UUID
    qty: int = Field(default=1, ge=1, le=100)


class InvoiceCreate(BaseModel):
    customer_id: uuid.UUID | None = None
    issued_at: datetime | None = None

    items: list[InvoiceItemCreate] = Field(min_length=1)
    discount_paise: int = Field(default=0, ge=0)

    payment_method: Literal["CASH", "UPI"] = "CASH"
    upi_ref: str | None = None


class InvoiceItemResponse(BaseModel):
    id: uuid.UUID
    service_id: uuid.UUID | None
    description: str
    qty: int
    unit_price_paise: int
    total_paise: int


class PaymentResponse(BaseModel):
    id: uuid.UUID
    method: str
    amount_paise: int
    reference: str | None


class InvoiceResponse(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID | None
    customer_name: str | None = None
    issued_at: datetime
    status: str
    subtotal_paise: int
    discount_paise: int
    total_paise: int

    items: list[InvoiceItemResponse]
    payments: list[PaymentResponse]


class InvoiceSummaryResponse(BaseModel):
    id: uuid.UUID
    issued_at: datetime
    customer_name: str | None
    subtotal_paise: int
    discount_paise: int
    total_paise: int
    payment_method: Literal["CASH", "UPI"]
