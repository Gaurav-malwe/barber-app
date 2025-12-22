from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.db.session import get_db
from app.models.service import Service
from app.models.shop import Shop
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse


router = APIRouter()


DEFAULT_SERVICES = [
    ("Haircut", 15000),
    ("Beard", 8000),
    ("Trimming", 6000),
    ("Facial", 25000),
    ("Haircut + Beard", 20000),
]


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    secure_cookie = settings.environment != "dev"

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=secure_cookie,
        samesite="lax",
        path="/",
        max_age=settings.access_token_expires_minutes * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=secure_cookie,
        samesite="lax",
        path="/api/auth/refresh",
        max_age=settings.refresh_token_expires_days * 24 * 60 * 60,
    )


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    user = User(email=payload.email, password_hash=hash_password(payload.password))
    shop = Shop(user=user, name=payload.shop_name, pan=payload.pan.strip().upper())
    db.add(user)
    db.add(shop)

    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email or PAN already exists")

    for name, price_paise in DEFAULT_SERVICES:
        db.add(Service(shop_id=shop.id, name=name, price_paise=price_paise))

    refresh_token = create_refresh_token()
    user.refresh_token_hash = hash_refresh_token(refresh_token)
    user.refresh_token_expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expires_days
    )

    access_token, access_expires_at = create_access_token(subject=str(user.id))
    _set_auth_cookies(response, access_token, refresh_token)

    db.commit()
    return TokenResponse(access_token_expires_at=access_expires_at.isoformat())


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    refresh_token = create_refresh_token()
    user.refresh_token_hash = hash_refresh_token(refresh_token)
    user.refresh_token_expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expires_days
    )

    access_token, access_expires_at = create_access_token(subject=str(user.id))
    _set_auth_cookies(response, access_token, refresh_token)

    db.commit()
    return TokenResponse(access_token_expires_at=access_expires_at.isoformat())


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    response: Response,
    db: Session = Depends(get_db),
    refresh_token: str | None = Cookie(default=None),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    token_hash = hash_refresh_token(refresh_token)
    user = db.query(User).filter(User.refresh_token_hash == token_hash).one_or_none()
    if not user or not user.refresh_token_expires_at:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if datetime.now(timezone.utc) >= user.refresh_token_expires_at:
        raise HTTPException(status_code=401, detail="Refresh token expired")

    # rotate refresh token
    new_refresh_token = create_refresh_token()
    user.refresh_token_hash = hash_refresh_token(new_refresh_token)
    user.refresh_token_expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expires_days
    )

    access_token, access_expires_at = create_access_token(subject=str(user.id))
    _set_auth_cookies(response, access_token, new_refresh_token)

    db.commit()
    return TokenResponse(access_token_expires_at=access_expires_at.isoformat())


@router.post("/logout")
def logout(
    response: Response,
    db: Session = Depends(get_db),
    refresh_token: str | None = Cookie(default=None),
):
    if refresh_token:
        token_hash = hash_refresh_token(refresh_token)
        user = db.query(User).filter(User.refresh_token_hash == token_hash).one_or_none()
        if user:
            user.refresh_token_hash = None
            user.refresh_token_expires_at = None
            db.commit()

    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/api/auth/refresh")
    return {"ok": True}
