from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerResponse


router = APIRouter()


@router.get("/", response_model=list[CustomerResponse])
def list_customers(db: Session = Depends(get_db), user=Depends(get_current_user)):
    customers = (
        db.query(Customer)
        .filter(Customer.shop_id == user.shop.id)
        .order_by(Customer.created_at.desc())
        .limit(200)
        .all()
    )
    return [
        CustomerResponse(id=c.id, name=c.name, phone=c.phone, notes=c.notes)
        for c in customers
    ]


@router.post("/", response_model=CustomerResponse)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    customer = Customer(shop_id=user.shop.id, name=payload.name, phone=payload.phone, notes=payload.notes)
    db.add(customer)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Customer phone already exists")
    db.refresh(customer)
    return CustomerResponse(id=customer.id, name=customer.name, phone=customer.phone, notes=customer.notes)
