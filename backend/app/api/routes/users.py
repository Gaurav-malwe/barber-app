from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.user import UserMeResponse


router = APIRouter()


@router.get("/me", response_model=UserMeResponse)
def me(db: Session = Depends(get_db), user=Depends(get_current_user)):
    shop = user.shop
    return UserMeResponse(id=user.id, email=user.email, shop_id=shop.id, shop_name=shop.name)
