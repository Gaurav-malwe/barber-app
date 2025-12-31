from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.invoice_item import InvoiceItem
from app.models.service import Service
from app.schemas.reports import (
    CustomerInsightsResponse,
    CustomerInsightRow,
    DormantCustomerRow,
    ServicePerformanceResponse,
    ServicePerformanceRow,
)


router = APIRouter()


@router.get("/customers", response_model=CustomerInsightsResponse)
def customer_insights(
    start: datetime,
    end: datetime,
    dormant_days: int = 30,
    include_never: bool = True,
    limit: int = 10,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    # Normalize params
    dormant_days = max(1, min(int(dormant_days), 3650))
    limit = max(1, min(int(limit), 100))

    # Range aggregates (only invoices with a saved customer)
    range_base = (
        db.query(
            Invoice.customer_id.label("customer_id"),
            func.count(Invoice.id).label("bill_count"),
            func.coalesce(func.sum(Invoice.subtotal_paise), 0).label("gross_paise"),
            func.coalesce(func.sum(Invoice.discount_paise), 0).label("discount_paise"),
            func.coalesce(func.sum(Invoice.total_paise), 0).label("net_paise"),
            func.max(Invoice.issued_at).label("last_invoice_at"),
        )
        .filter(
            Invoice.shop_id == user.shop.id,
            Invoice.customer_id.isnot(None),
            Invoice.issued_at >= start,
            Invoice.issued_at < end,
        )
        .group_by(Invoice.customer_id)
        .subquery()
    )

    repeat_rows = (
        db.query(
            Customer.id,
            Customer.name,
            range_base.c.bill_count,
            range_base.c.gross_paise,
            range_base.c.discount_paise,
            range_base.c.net_paise,
            range_base.c.last_invoice_at,
        )
        .join(range_base, range_base.c.customer_id == Customer.id)
        .filter(Customer.shop_id == user.shop.id, range_base.c.bill_count >= 2)
        .order_by(range_base.c.bill_count.desc(), range_base.c.net_paise.desc())
        .limit(limit)
        .all()
    )

    top_rows = (
        db.query(
            Customer.id,
            Customer.name,
            range_base.c.bill_count,
            range_base.c.gross_paise,
            range_base.c.discount_paise,
            range_base.c.net_paise,
            range_base.c.last_invoice_at,
        )
        .join(range_base, range_base.c.customer_id == Customer.id)
        .filter(Customer.shop_id == user.shop.id)
        .order_by(range_base.c.net_paise.desc(), range_base.c.bill_count.desc())
        .limit(limit)
        .all()
    )

    # Dormant customers: based on last invoice all-time
    cutoff = datetime.now(timezone.utc) - timedelta(days=dormant_days)

    last_all_time = (
        db.query(
            Invoice.customer_id.label("customer_id"),
            func.count(Invoice.id).label("bill_count_all_time"),
            func.max(Invoice.issued_at).label("last_invoice_at"),
        )
        .filter(Invoice.shop_id == user.shop.id, Invoice.customer_id.isnot(None))
        .group_by(Invoice.customer_id)
        .subquery()
    )

    dormant_query = (
        db.query(
            Customer.id,
            Customer.name,
            last_all_time.c.last_invoice_at,
            func.coalesce(last_all_time.c.bill_count_all_time, 0).label("bill_count_all_time"),
        )
        .outerjoin(last_all_time, last_all_time.c.customer_id == Customer.id)
        .filter(Customer.shop_id == user.shop.id)
    )

    if include_never:
        dormant_query = dormant_query.filter(
            (last_all_time.c.last_invoice_at.is_(None))
            | (last_all_time.c.last_invoice_at < cutoff)
        )
        dormant_query = dormant_query.order_by(
            last_all_time.c.last_invoice_at.isnot(None).asc(),
            last_all_time.c.last_invoice_at.asc().nullsfirst(),
        )
    else:
        dormant_query = dormant_query.filter(last_all_time.c.last_invoice_at < cutoff)
        dormant_query = dormant_query.order_by(last_all_time.c.last_invoice_at.asc())

    dormant_rows = dormant_query.limit(limit).all()

    return CustomerInsightsResponse(
        start=start,
        end=end,
        dormant_days=dormant_days,
        repeat_customers=[
            CustomerInsightRow(
                customer_id=r[0],
                customer_name=r[1],
                bill_count=int(r[2] or 0),
                gross_paise=int(r[3] or 0),
                discount_paise=int(r[4] or 0),
                net_paise=int(r[5] or 0),
                last_invoice_at=r[6],
            )
            for r in repeat_rows
        ],
        top_customers=[
            CustomerInsightRow(
                customer_id=r[0],
                customer_name=r[1],
                bill_count=int(r[2] or 0),
                gross_paise=int(r[3] or 0),
                discount_paise=int(r[4] or 0),
                net_paise=int(r[5] or 0),
                last_invoice_at=r[6],
            )
            for r in top_rows
        ],
        dormant_customers=[
            DormantCustomerRow(
                customer_id=r[0],
                customer_name=r[1],
                last_invoice_at=r[2],
                bill_count_all_time=int(r[3] or 0),
            )
            for r in dormant_rows
        ],
    )


@router.get("/services", response_model=ServicePerformanceResponse)
def service_performance(
    start: datetime,
    end: datetime,
    limit: int = 10,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    limit = max(1, min(int(limit), 100))

    base = (
        db.query(
            InvoiceItem.service_id.label("service_id"),
            Service.name.label("service_name"),
            func.coalesce(func.sum(InvoiceItem.qty), 0).label("qty"),
            func.coalesce(func.sum(InvoiceItem.total_paise), 0).label("revenue_paise"),
            func.count(func.distinct(InvoiceItem.invoice_id)).label("invoice_count"),
        )
        .join(Invoice, Invoice.id == InvoiceItem.invoice_id)
        .join(Service, Service.id == InvoiceItem.service_id)
        .filter(
            Invoice.shop_id == user.shop.id,
            Invoice.issued_at >= start,
            Invoice.issued_at < end,
            Service.shop_id == user.shop.id,
        )
        .group_by(InvoiceItem.service_id, Service.name)
    )

    by_revenue = (
        base.order_by(func.coalesce(func.sum(InvoiceItem.total_paise), 0).desc())
        .limit(limit)
        .all()
    )
    by_qty = (
        base.order_by(func.coalesce(func.sum(InvoiceItem.qty), 0).desc())
        .limit(limit)
        .all()
    )

    def to_row(r) -> ServicePerformanceRow:
        return ServicePerformanceRow(
            service_id=r[0],
            service_name=r[1],
            qty=int(r[2] or 0),
            revenue_paise=int(r[3] or 0),
            invoice_count=int(r[4] or 0),
        )

    return ServicePerformanceResponse(
        start=start,
        end=end,
        limit=limit,
        top_by_revenue=[to_row(r) for r in by_revenue],
        top_by_quantity=[to_row(r) for r in by_qty],
    )
