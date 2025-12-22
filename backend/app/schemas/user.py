import uuid
from pydantic import BaseModel, EmailStr


class UserMeResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    shop_id: uuid.UUID
    shop_name: str
