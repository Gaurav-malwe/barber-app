from fastapi import APIRouter

from app.api.routes import auth, users, services, customers, invoices


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(services.router, prefix="/services", tags=["services"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
