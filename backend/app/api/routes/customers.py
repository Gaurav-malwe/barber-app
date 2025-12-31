from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate


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
        if payload.phone:
            raise HTTPException(status_code=400, detail="Customer phone already exists")
        raise HTTPException(status_code=400, detail="Failed to create customer")
    db.refresh(customer)
    return CustomerResponse(id=customer.id, name=customer.name, phone=customer.phone, notes=customer.notes)


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    customer = db.get(Customer, customer_id)
    if not customer or customer.shop_id != user.shop.id:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerResponse(id=customer.id, name=customer.name, phone=customer.phone, notes=customer.notes)


@router.patch("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: str, payload: CustomerUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    customer = db.get(Customer, customer_id)
    if not customer or customer.shop_id != user.shop.id:
        raise HTTPException(status_code=404, detail="Customer not found")

    fields = getattr(payload, "model_fields_set", set())
    if "name" in fields and payload.name is not None:
        customer.name = payload.name
    if "phone" in fields:
        customer.phone = payload.phone
    if "notes" in fields:
        customer.notes = payload.notes

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        if payload.phone:
            raise HTTPException(status_code=400, detail="Customer phone already exists")
        raise HTTPException(status_code=400, detail="Failed to update customer")

    db.refresh(customer)
    return CustomerResponse(id=customer.id, name=customer.name, phone=customer.phone, notes=customer.notes)
