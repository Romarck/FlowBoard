"""Pydantic schemas for auth endpoints."""

import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    """Request body for POST /api/v1/auth/register."""

    email: EmailStr
    name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Enforce at least 1 uppercase letter and 1 digit."""
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseModel):
    """Request body for POST /api/v1/auth/login."""

    email: EmailStr
    password: str


class UpdateMeRequest(BaseModel):
    """Request body for PATCH /api/v1/auth/me."""

    name: str | None = Field(None, min_length=2, max_length=255)
    avatar_url: str | None = Field(None, max_length=500)


class ForgotPasswordRequest(BaseModel):
    """Request body for POST /api/v1/auth/forgot-password."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Request body for POST /api/v1/auth/reset-password."""

    token: str
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Enforce at least 1 uppercase letter and 1 digit."""
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserResponse(BaseModel):
    """Response body representing a user (never includes password_hash)."""

    id: str  # UUID as string
    email: str
    name: str
    role: str
    avatar_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """Response body for login and refresh endpoints."""

    access_token: str
    token_type: str = "bearer"
