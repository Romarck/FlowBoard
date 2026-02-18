"""Seed script — creates default admin user for development.

Usage:
    docker compose exec backend python -m app.seed
"""

import asyncio
import hashlib

from sqlalchemy import select

from app.config import settings
from app.database import Base, engine, async_session
from app.auth.models import User, UserRole


def hash_password(password: str) -> str:
    """Simple SHA-256 hash for seed data. Will be replaced with bcrypt in auth module."""
    return hashlib.sha256(password.encode()).hexdigest()


async def seed() -> None:
    """Create default admin user if it does not already exist."""
    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == "admin@flowboard.dev"))
        existing = result.scalar_one_or_none()

        if existing:
            print("[seed] Admin user already exists, skipping.")
            return

        admin = User(
            email="admin@flowboard.dev",
            name="Admin",
            password_hash=hash_password("admin123"),
            role=UserRole.admin,
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        print(f"[seed] Admin user created: admin@flowboard.dev (id={admin.id})")


async def main() -> None:
    print(f"[seed] Connecting to database: {settings.DATABASE_URL.split('@')[-1]}")
    await seed()
    await engine.dispose()
    print("[seed] Done.")


if __name__ == "__main__":
    asyncio.run(main())
