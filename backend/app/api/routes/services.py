from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceResponse, ServiceUpdate


router = APIRouter()


@router.get("/", response_model=list[ServiceResponse])
def list_services(db: Session = Depends(get_db), user=Depends(get_current_user)):
    services = (
        db.query(Service)
        .filter(Service.shop_id == user.shop.id)
        .order_by(Service.name.asc())
        .all()
    )
    return [
        ServiceResponse(id=s.id, name=s.name, price_paise=s.price_paise, active=s.active)
        for s in services
    ]


@router.post("/", response_model=ServiceResponse)
def create_service(payload: ServiceCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    service = Service(shop_id=user.shop.id, name=payload.name, price_paise=payload.price_paise)
    db.add(service)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Service name already exists")
    db.refresh(service)
    return ServiceResponse(id=service.id, name=service.name, price_paise=service.price_paise, active=service.active)


@router.patch("/{service_id}", response_model=ServiceResponse)
def update_service(service_id: str, payload: ServiceUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    service = db.get(Service, service_id)
    if not service or service.shop_id != user.shop.id:
        raise HTTPException(status_code=404, detail="Service not found")

    if payload.name is not None:
        service.name = payload.name
    if payload.price_paise is not None:
        service.price_paise = payload.price_paise
    if payload.active is not None:
        service.active = payload.active

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Service name already exists")

    db.refresh(service)
    return ServiceResponse(id=service.id, name=service.name, price_paise=service.price_paise, active=service.active)
