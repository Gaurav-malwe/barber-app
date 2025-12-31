from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.invoice_item import InvoiceItem
from app.models.payment import Payment
from app.models.service import Service
from app.schemas.invoice import InvoiceCreate, InvoiceResponse, InvoiceSummaryResponse


router = APIRouter()


@router.get("/", response_model=list[InvoiceSummaryResponse])
def list_invoices(
    customer_id: uuid.UUID | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = (
        db.query(Invoice, Customer.name)
        .outerjoin(Customer, Customer.id == Invoice.customer_id)
        .filter(Invoice.shop_id == user.shop.id)
    )
    if customer_id is not None:
        q = q.filter(Invoice.customer_id == customer_id)

    if start is not None:
        q = q.filter(Invoice.issued_at >= start)
    if end is not None:
        q = q.filter(Invoice.issued_at < end)

    rows = q.order_by(Invoice.issued_at.desc()).limit(200).all()

    invoices = [inv for inv, _ in rows]
    invoice_ids = [inv.id for inv in invoices]
    payments = (
        db.query(Payment)
        .filter(Payment.invoice_id.in_(invoice_ids))
        .order_by(Payment.created_at.asc())
        .all()
        if invoice_ids
        else []
    )
    method_by_invoice: dict[uuid.UUID, str] = {}
    for p in payments:
        if p.invoice_id not in method_by_invoice:
            method_by_invoice[p.invoice_id] = p.method

    summaries: list[InvoiceSummaryResponse] = []
    for inv, customer_name in rows:
        method = (method_by_invoice.get(inv.id) or "cash").upper()
        if method not in ("CASH", "UPI"):
            method = "CASH"
        summaries.append(
            InvoiceSummaryResponse(
                id=inv.id,
                issued_at=inv.issued_at,
                customer_name=customer_name,
                subtotal_paise=inv.subtotal_paise,
                discount_paise=inv.discount_paise,
                total_paise=inv.total_paise,
                payment_method=method,  # type: ignore[arg-type]
            )
        )
    return summaries


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id, Invoice.shop_id == user.shop.id)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    customer_name: str | None = None
    customer_phone: str | None = None
    if invoice.customer_id is not None:
        customer = (
            db.query(Customer)
            .filter(Customer.id == invoice.customer_id, Customer.shop_id == user.shop.id)
            .first()
        )
        customer_name = customer.name if customer else None
        customer_phone = customer.phone if customer else None

    items = (
        db.query(InvoiceItem)
        .filter(InvoiceItem.invoice_id == invoice.id)
        .order_by(InvoiceItem.created_at.asc())
        .all()
    )
    payments = (
        db.query(Payment)
        .filter(Payment.invoice_id == invoice.id)
        .order_by(Payment.created_at.asc())
        .all()
    )

    return InvoiceResponse(
        id=invoice.id,
        customer_id=invoice.customer_id,
        customer_name=customer_name,
        customer_phone=customer_phone,
        issued_at=invoice.issued_at,
        status=invoice.status,
        subtotal_paise=invoice.subtotal_paise,
        discount_paise=invoice.discount_paise,
        total_paise=invoice.total_paise,
        items=[
            {
                "id": it.id,
                "service_id": it.service_id,
                "description": it.description,
                "qty": it.qty,
                "unit_price_paise": it.unit_price_paise,
                "total_paise": it.total_paise,
            }
            for it in items
        ],
        payments=[
            {
                "id": p.id,
                "method": p.method,
                "amount_paise": p.amount_paise,
                "reference": p.reference,
            }
            for p in payments
        ],
    )


@router.post("/", response_model=InvoiceResponse)
def create_invoice(payload: InvoiceCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    customer_name: str | None = None
    customer_phone: str | None = None
    if payload.customer_id is not None:
        customer = (
            db.query(Customer)
            .filter(Customer.id == payload.customer_id, Customer.shop_id == user.shop.id)
            .first()
        )
        if not customer:
            raise HTTPException(status_code=400, detail="Customer not found")
        customer_name = customer.name
        customer_phone = customer.phone

    service_ids = [it.service_id for it in payload.items]
    services = (
        db.query(Service)
        .filter(Service.shop_id == user.shop.id, Service.id.in_(service_ids))
        .all()
    )
    service_by_id = {s.id: s for s in services}

    missing = [str(sid) for sid in service_ids if sid not in service_by_id]
    if missing:
        raise HTTPException(status_code=400, detail=f"Invalid service(s): {', '.join(missing)}")

    subtotal_paise = 0
    for it in payload.items:
        s = service_by_id[it.service_id]
        subtotal_paise += int(s.price_paise) * int(it.qty)

    discount_paise = min(int(payload.discount_paise or 0), subtotal_paise)
    total_paise = max(0, subtotal_paise - discount_paise)

    issued_at = payload.issued_at or datetime.now(timezone.utc)

    invoice = Invoice(
        shop_id=user.shop.id,
        customer_id=payload.customer_id,
        issued_at=issued_at,
        status="paid",
        subtotal_paise=subtotal_paise,
        discount_paise=discount_paise,
        total_paise=total_paise,
    )
    db.add(invoice)
    db.flush()

    items: list[InvoiceItem] = []
    for it in payload.items:
        s = service_by_id[it.service_id]
        unit = int(s.price_paise)
        qty = int(it.qty)
        total = unit * qty
        items.append(
            InvoiceItem(
                invoice_id=invoice.id,
                service_id=s.id,
                description=s.name,
                qty=qty,
                unit_price_paise=unit,
                total_paise=total,
            )
        )
    db.add_all(items)

    method = payload.payment_method.lower()
    reference = payload.upi_ref.strip() if payload.upi_ref and method == "upi" else None
    payment = Payment(
        invoice_id=invoice.id,
        method=method,
        amount_paise=total_paise,
        reference=reference or None,
    )
    db.add(payment)

    db.commit()
    db.refresh(invoice)

    # Re-query items/payments for response
    db.refresh(payment)
    for item in items:
        db.refresh(item)

    return InvoiceResponse(
        id=invoice.id,
        customer_id=invoice.customer_id,
        customer_name=customer_name,
        customer_phone=customer_phone,
        issued_at=invoice.issued_at,
        status=invoice.status,
        subtotal_paise=invoice.subtotal_paise,
        discount_paise=invoice.discount_paise,
        total_paise=invoice.total_paise,
        items=[
            {
                "id": it.id,
                "service_id": it.service_id,
                "description": it.description,
                "qty": it.qty,
                "unit_price_paise": it.unit_price_paise,
                "total_paise": it.total_paise,
            }
            for it in items
        ],
        payments=[
            {
                "id": payment.id,
                "method": payment.method,
                "amount_paise": payment.amount_paise,
                "reference": payment.reference,
            }
        ],
    )
