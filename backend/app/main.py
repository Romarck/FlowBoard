"""FlowBoard API — FastAPI application entry point."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.attachments.router import router as attachments_router
from app.auth.router import router as auth_router
from app.database import async_session
from app.projects.router import router as projects_router
from app.issues.router import router as issues_router
from app.sprints.router import router as sprints_router
from app.comments.router import router as comments_router
from app.search.router import router as search_router

app = FastAPI(title="FlowBoard API", version="0.1.0")

# Register routers
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(issues_router)
app.include_router(sprints_router)
app.include_router(comments_router)
app.include_router(attachments_router)
app.include_router(search_router)

# Mount static files for uploads
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    """Health check endpoint — verifies API is running and database is reachable."""
    db_status = "disconnected"
    try:
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception:
        db_status = "disconnected"

    status = "ok" if db_status == "connected" else "degraded"
    return {"status": status, "db": db_status}
