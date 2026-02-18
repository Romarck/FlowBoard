"""Auth business logic — registration and authentication services."""

import hashlib
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.auth.schemas import RegisterRequest
from app.auth.utils import hash_password, verify_password


async def register_user(db: AsyncSession, data: RegisterRequest) -> User:
    """Register a new user.

    - Hash password with bcrypt
    - First user in the system gets role='admin', others get 'developer'
    - Raises 409 if email is already taken
    """
    # 1. Check if this will be the first user (determines role)
    user_count = await db.scalar(select(func.count()).select_from(User))
    role = UserRole.admin if user_count == 0 else UserRole.developer

    # 2. Hash password
    hashed = hash_password(data.password)

    # 3. Create user
    user = User(
        email=data.email,
        name=data.name,
        password_hash=hashed,
        role=role,
    )
    db.add(user)

    try:
        await db.commit()
        await db.refresh(user)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")

    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    """Authenticate a user by email and password.

    Returns the User if credentials are valid, None if email not found
    or password is wrong. Raises HTTPException(403) if account is inactive.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        return None

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")

    return user


async def create_reset_token(db: AsyncSession, email: str) -> str | None:
    """Generate a reset token for the user with the given email.

    Returns the plain token if email exists, None if email not found.
    The token hash and expiration are stored in the database.
    Token expires in 1 hour.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return None

    token = str(uuid.uuid4())
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    user.reset_token_hash = token_hash
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    await db.commit()
    return token


async def reset_password(db: AsyncSession, token: str, new_password: str) -> None:
    """Reset user password using a reset token.

    Validates the token and expiration before updating the password.
    Raises HTTPException(400) if token is invalid or expired.
    """
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    result = await db.execute(
        select(User).where(
            User.reset_token_hash == token_hash,
            User.reset_token_expires > datetime.now(timezone.utc),
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Token expired or invalid")

    user.password_hash = hash_password(new_password)
    user.reset_token_hash = None
    user.reset_token_expires = None
    await db.commit()
