import uuid
from datetime import datetime

from pydantic import BaseModel


class CustomerInsightRow(BaseModel):
    customer_id: uuid.UUID
    customer_name: str

    bill_count: int
    gross_paise: int
    discount_paise: int
    net_paise: int

    last_invoice_at: datetime | None = None


class DormantCustomerRow(BaseModel):
    customer_id: uuid.UUID
    customer_name: str
    last_invoice_at: datetime | None = None
    bill_count_all_time: int


class CustomerInsightsResponse(BaseModel):
    start: datetime
    end: datetime
    dormant_days: int

    repeat_customers: list[CustomerInsightRow]
    top_customers: list[CustomerInsightRow]
    dormant_customers: list[DormantCustomerRow]


class ServicePerformanceRow(BaseModel):
    service_id: uuid.UUID
    service_name: str

    qty: int
    revenue_paise: int
    invoice_count: int


class ServicePerformanceResponse(BaseModel):
    start: datetime
    end: datetime
    limit: int

    top_by_revenue: list[ServicePerformanceRow]
    top_by_quantity: list[ServicePerformanceRow]
