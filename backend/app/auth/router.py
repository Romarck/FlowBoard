"""Auth API router — registration, login, token refresh, and user profile endpoints."""

import uuid

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.auth.schemas import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UpdateMeRequest,
    UserResponse,
)
from app.auth.service import (
    authenticate_user,
    create_reset_token,
    register_user,
    reset_password,
)
from app.auth.utils import create_access_token, create_refresh_token, decode_token
from app.config import settings
from app.database import get_db

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _user_response(user: User) -> UserResponse:
    """Convert a User model to a UserResponse schema."""
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        role=user.role.value,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
    )


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    user = await register_user(db, data)
    return _user_response(user)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """Authenticate with email and password, return access token and set refresh cookie."""
    user = await authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(str(user.id), user.role.value)
    refresh_token = create_refresh_token(str(user.id))

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=not settings.DEBUG,  # True in production (requires HTTPS)
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/api/v1/auth",
    )

    return TokenResponse(access_token=access_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    refresh_token: str | None = Cookie(None),
    db: AsyncSession = Depends(get_db),
):
    """Generate a new access token from the refresh token cookie (token rotation)."""
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    # Verify user still exists and is active
    user = await db.get(User, uuid.UUID(user_id))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    # Token rotation: issue new access + new refresh token
    new_access_token = create_access_token(str(user.id), user.role.value)
    new_refresh_token = create_refresh_token(str(user.id))

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/api/v1/auth",
    )

    return TokenResponse(access_token=new_access_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return _user_response(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UpdateMeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's name and/or avatar_url."""
    if data.name is not None:
        current_user.name = data.name
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url

    await db.commit()
    await db.refresh(current_user)
    return _user_response(current_user)


@router.post("/logout")
async def logout(response: Response):
    """Clear the refresh token cookie."""
    response.delete_cookie(
        key="refresh_token",
        path="/api/v1/auth",
    )
    return {"detail": "Logged out"}


@router.post("/forgot-password", status_code=200)
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request a password reset token.

    Always returns 200 (even if email doesn't exist) for security.
    If email exists, generates a reset token and logs it to console.
    """
    token = await create_reset_token(db, data.email)
    if token:
        # MVP: log to console (email integration in v2)
        print(f"[RESET] Token for {data.email}: {token}")
    # Always return 200 (security: don't reveal if email exists)
    return {"message": "If the email exists, reset instructions have been sent"}


@router.post("/reset-password", status_code=200)
async def reset_password_endpoint(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using a reset token.

    Validates token and updates password if token is valid and not expired.
    """
    await reset_password(db, data.token, data.new_password)
    return {"message": "Password updated successfully"}
