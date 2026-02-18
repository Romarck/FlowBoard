# FlowBoard

Agile Project Management System -- a self-hosted, open-source alternative inspired by Jira Software.

## Features (MVP)

- Kanban and Scrum boards with drag-and-drop
- Issue hierarchy (Epic > Story > Task > Bug > Subtask)
- Sprint management with burndown charts
- Backlog grooming and prioritization
- Real-time updates via WebSocket
- Role-based access control

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript (Vite) |
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL 15 |
| ORM | SQLAlchemy 2.0 (async) + Alembic |
| Auth | JWT (access + refresh tokens) |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- Git

## Quick Start

1. **Clone and enter the project directory:**

   ```bash
   cd flowboard
   ```

2. **Create environment file for backend:**

   ```bash
   cp backend/.env.example backend/.env
   ```

3. **Start all services:**

   ```bash
   make dev
   # or: docker compose up
   ```

4. **Access the application:**

   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs (Swagger): http://localhost:8000/docs
   - Health check: http://localhost:8000/health

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start all services (db, backend, frontend) |
| `make dev-build` | Start with forced rebuild |
| `make stop` | Stop all services |
| `make test` | Run backend and frontend tests |
| `make lint` | Run linters (ruff for Python, eslint for TypeScript) |
| `make migrate` | Run Alembic database migrations |
| `make clean` | Stop services and remove volumes |

## Project Structure

```
flowboard/
├── backend/           # FastAPI application
│   ├── app/           # Application code
│   ├── tests/         # Python tests
│   ├── alembic/       # Database migrations
│   ├── pyproject.toml # Python dependencies (Poetry)
│   └── Dockerfile
├── frontend/          # React SPA
│   ├── src/           # TypeScript source
│   ├── package.json   # Node dependencies
│   ├── vite.config.ts # Vite configuration
│   └── Dockerfile
├── docker-compose.yml # Development environment
├── Makefile           # Development shortcuts
└── .github/workflows/ # CI pipeline
```

## Development

### Backend Development

The backend auto-reloads on file changes (via uvicorn `--reload`).

```bash
# Run backend tests
make test

# Run linter
make lint

# Run database migrations
make migrate
```

### Frontend Development

The frontend uses Vite HMR for instant updates during development.

### Database

PostgreSQL runs on port 5432 with the following defaults:

- Database: `flowboard`
- User: `flowboard`
- Password: `flowboard_dev`

Connect directly:

```bash
docker compose exec db psql -U flowboard -d flowboard
```

## CI/CD

GitHub Actions runs on every push and pull request to `main`:

- Backend: Ruff lint + pytest
- Frontend: ESLint + TypeScript type checking

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the project conventions
3. Ensure `make lint` and `make test` pass
4. Open a pull request

## Architecture

See `docs/architecture-flowboard.md` for the full architecture document.

## License

Private project.
