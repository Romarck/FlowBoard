# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FlowBoard** is a self-hosted, open-source Agile Project Management System (Jira alternative). It's a full-stack application with a React+TypeScript frontend and FastAPI backend, featuring issue hierarchies, sprint planning, Kanban boards, real-time notifications, and RBAC.

## Quick Start

All commands use **Docker Compose** for consistency:

```bash
# Start all services (db, backend, frontend)
make dev

# Or with rebuild
make dev-build

# Stop services
make stop

# Run all tests
make test

# Run linters
make lint

# Database migrations
make migrate
```

**Access points (after `make dev`):**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- Database: `localhost:5433` (user: `flowboard`, pass: `flowboard_dev`)

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React + TypeScript | 18 + 5.6 |
| **Frontend Build** | Vite | 6 |
| **State** | Zustand + TanStack Query | 5 + 5.90 |
| **Styling** | Tailwind CSS v4 | 4.1 |
| **UI Components** | Radix UI + shadcn/ui | Latest |
| **Drag/Drop** | @dnd-kit | 6.1 + 8.0 |
| **Backend** | FastAPI + Uvicorn | 0.115 + 0.34 |
| **Database** | PostgreSQL | 15 (via Docker) |
| **ORM** | SQLAlchemy 2.0 (async) | 2.0 |
| **Migrations** | Alembic | 1.14 |
| **Auth** | JWT (access + refresh tokens) | — |
| **Testing** | Vitest + React Testing Library (FE) / pytest (BE) | 4.0 + pytest 8.0 |

## Architecture Overview

### High-Level Structure

```
FlowBoard (full-stack monorepo)
├── frontend/               # React SPA
│   ├── src/
│   │   ├── api/           # Axios clients (organized by domain: issues, projects, sprints, etc.)
│   │   ├── components/    # UI components (organized by feature: board/, backlog/, issues/, etc.)
│   │   ├── pages/         # Route pages (auth/, projects/, board/, sprints/, dashboard/)
│   │   ├── hooks/         # React Query hooks (organized by domain)
│   │   ├── stores/        # Zustand stores (auth state)
│   │   ├── types/         # TypeScript interfaces (shared across modules)
│   │   ├── utils/         # date formatting, helpers
│   │   └── test/          # Setup files, fixtures
│   ├── vite.config.ts     # Vite + Vitest config
│   └── package.json
│
├── backend/                # FastAPI REST API
│   ├── app/
│   │   ├── auth/          # JWT, login, register, refresh tokens
│   │   ├── projects/      # Projects CRUD, members, workflows, labels, metrics
│   │   ├── issues/        # Issues CRUD, move, history, relations (Epic > Story > Task > Bug > Subtask)
│   │   ├── sprints/       # Sprint lifecycle (planning → active → completed)
│   │   ├── comments/      # Issue comments (edit, delete)
│   │   ├── attachments/   # File upload/download
│   │   ├── notifications/ # WebSocket real-time notifications
│   │   ├── search/        # Full-text search, saved filters
│   │   ├── common/        # Shared permission checks, dependencies
│   │   └── main.py        # FastAPI app definition
│   ├── alembic/           # Database migration scripts
│   ├── tests/             # 106 pytest tests (organized by module)
│   ├── pyproject.toml     # Poetry dependencies
│   └── Dockerfile
│
├── docker-compose.yml     # Services: db, backend, frontend
├── Makefile               # Convenience targets
└── docs/                  # Project documentation
```

### System Architecture

**Three-tier architecture with async/WebSocket support:**

1. **Frontend (React SPA)**
   - Vite dev server with HMR (hot module replacement)
   - Axios API clients organized by domain
   - Zustand for auth state, React Query for server state
   - dnd-kit for drag-and-drop issue reordering

2. **Backend (FastAPI)**
   - Modular endpoints organized by domain (projects, issues, sprints, etc.)
   - SQLAlchemy 2.0 async ORM with asyncpg driver
   - JWT auth with access/refresh tokens
   - WebSocket support for real-time notifications
   - Service layer pattern for business logic

3. **Database (PostgreSQL)**
   - Async connection pool via asyncpg
   - Alembic migrations (version-controlled schema changes)
   - Normalized schema: Users, Projects, Issues, Sprints, Comments, Attachments, etc.
   - Role-based access control (RBAC) columns in permission-sensitive tables

## Development Workflow

### Frontend Development

**Start dev server** (automatically runs via `make dev`):
```bash
cd frontend
npm run dev
```
- Vite serves on port 5173 with HMR
- Proxy to backend API at `/api` → `http://backend:8000`
- Changes hot-reload instantly

**Run tests**:
```bash
cd frontend
npm test                    # Run all tests
npm test -- src/pages     # Run tests in specific directory
npm run test:ui           # Interactive Vitest UI
npm run test:coverage     # Coverage report
```

**Type checking & linting**:
```bash
npm run typecheck         # tsc type checking
npm run lint              # ESLint
```

**Pattern: React Query hooks**
- Hook file: `src/hooks/use{Domain}Query.ts`
- API client: `src/api/{domain}.ts`
- Component consumes hook, hook uses API client
- Example: `useIssuesQuery` → `issuesAPI.getIssues()` → GET `/api/issues`

### Backend Development

**Start dev server** (automatically runs via `make dev`):
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- Auto-reloads on file changes
- API docs at http://localhost:8000/docs (Swagger)

**Run tests**:
```bash
cd backend
python -m pytest tests/                    # All tests (106 total)
python -m pytest tests/auth/               # Single module
python -m pytest tests/issues/test_crud.py # Single file
python -m pytest -k "test_create"         # By test name pattern
python -m pytest --cov=app --cov-report=term-missing  # With coverage
```

**Linting**:
```bash
ruff check app/           # Fast Python linter
ruff format app/          # Auto-format
```

**Database migrations**:
```bash
# Create new migration (from schema changes)
alembic revision --autogenerate -m "add_column_to_issues"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```

**Pattern: Service layer**
- Route handler receives request
- Calls service method (e.g., `IssueService.create_issue()`)
- Service contains business logic, validation, permission checks
- Service calls ORM layer for persistence
- Example: `POST /api/issues` → `IssueRouter.create_issue()` → `IssueService.create_issue()` → `db.add(Issue)`

### Database Setup

PostgreSQL runs in Docker with defaults:
- **Database**: `flowboard`
- **User**: `flowboard`
- **Password**: `flowboard_dev`
- **Port**: 5433 (mapped internally to 5432)

**Connect directly**:
```bash
# Via Docker
docker compose exec db psql -U flowboard -d flowboard

# Via host (if postgres CLI installed)
psql -h localhost -p 5433 -U flowboard -d flowboard
```

**Seed demo data**:
```bash
docker compose exec backend python -m app.seed
```

**Database structure** (key tables):
- `users` — Accounts, roles (Admin, PM, Developer, Viewer)
- `projects` — Project metadata
- `project_members` — User ↔ Project membership with roles
- `issues` — All issue types (Epic, Story, Task, Bug, Subtask) with parent_id for hierarchy
- `sprints` — Sprint lifecycle (planning, active, completed)
- `issue_comments` — Comments on issues with edit history
- `attachments` — Files uploaded to issues
- `issue_history` — Audit trail of changes

## Common Development Patterns

### Frontend Component Structure

```typescript
// src/components/issues/IssueCard.tsx
import { useIssuesQuery } from '@/hooks/useIssuesQuery'

export function IssueCard({ issueId }: { issueId: string }) {
  const { data: issue, isLoading } = useIssuesQuery.useGetIssue(issueId)

  if (isLoading) return <div>Loading...</div>
  return <div>{issue.title}</div>
}
```

**Patterns:**
- Hooks in `src/hooks/` organized by domain (useIssuesQuery, useProjectsQuery, etc.)
- Components receive hooks data, don't make direct API calls
- API clients in `src/api/` handle all backend communication
- Types shared in `src/types/` (no duplication)

### Backend Endpoint Structure

```python
# app/issues/router.py
from fastapi import APIRouter, Depends
from .service import IssueService
from ..common.security import get_current_user

router = APIRouter(prefix="/issues", tags=["issues"])

@router.post("")
async def create_issue(
    payload: CreateIssuePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = IssueService(db)
    issue = await service.create_issue(payload, current_user)
    return issue
```

**Patterns:**
- Router defines endpoints with dependencies
- Service layer contains business logic
- `get_current_user` ensures authentication
- `get_db` provides async DB session
- All database ops use SQLAlchemy async with asyncpg

### Testing Pattern

**Frontend (Vitest + React Testing Library):**
```typescript
import { render, screen } from '@testing-library/react'
import { IssueCard } from './IssueCard'

vi.mock('@/hooks/useIssuesQuery', () => ({
  useIssuesQuery: {
    useGetIssue: vi.fn(() => ({
      data: { id: '1', title: 'Test Issue' },
      isLoading: false
    }))
  }
}))

it('renders issue title', () => {
  render(<IssueCard issueId="1" />)
  expect(screen.getByText('Test Issue')).toBeInTheDocument()
})
```

**Backend (pytest with async support):**
```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_create_issue(async_client: AsyncClient, db_session):
    response = await async_client.post(
        "/api/issues",
        json={"title": "New Issue", "project_id": "1"}
    )
    assert response.status_code == 201
    assert response.json()["title"] == "New Issue"
```

## Real-Time Notifications (WebSocket)

Backend exposes WebSocket endpoint at `/ws/notifications/{user_id}`.

**Connection flow:**
1. Frontend connects: `ws://localhost:8000/ws/notifications/{user_id}`
2. Backend manages connection in `app/notifications/ws_manager.py`
3. When issue changes, service broadcasts to subscribed users
4. Frontend receives event and updates state via React Query invalidation

**No WebSocket client library needed** — browser native WebSocket API works directly.

## AIOS Integration: Story-Driven Development

This project uses **Synkra AIOS**, an AI-orchestrated system for full-stack development. All work must flow through the story-driven development cycle (SDC).

### AIOS Story Development Cycle (4 Phases)

```
Phase 1: Create (@sm)    → Phase 2: Validate (@po)    → Phase 3: Implement (@dev)    → Phase 4: QA (@qa)
Draft                    → Ready                       → InProgress                   → InReview → Done
```

**Phase 1 — Create (@sm)**
- Story Manager creates story from epic/PRD in `docs/stories/{epic}.{story}.story.md`
- Story must include: title, description, acceptance criteria, scope, complexity, risks
- Status: **Draft**

**Phase 2 — Validate (@po)**
- Product Owner validates against 10-point checklist (see `.claude/rules/story-lifecycle.md`)
- Decision: GO (≥7/10) or NO-GO (required fixes listed)
- If GO: PO updates story status to **Ready** in story file
- Story ready for implementation

**Phase 3 — Implement (@dev)**
- Developer implements exactly per acceptance criteria
- Update File List in story as files change
- Mark task checkboxes `[x]` as work completes
- Ensure `make test` && `make lint` pass before submitting
- CodeRabbit self-healing runs (max 2 iterations for CRITICAL issues)
- Status: **InProgress**

**Phase 4 — QA Gate (@qa)**
- QA runs 7 quality checks: code patterns, unit tests, AC met, regressions, performance, security, docs
- Decision: PASS / CONCERNS / FAIL / WAIVED
- If FAIL: QA Loop (max 5 iterations of @dev fix → @qa re-review)
- Status: **InReview** → **Done** (when PASS/CONCERNS)

**On PASS/CONCERNS:**
- @devops pushes via git to main (exclusive authority)

### Agent Activation & Commands

**Activate an agent** during development:
```
@dev          # Developer — implements stories, marks progress
@qa           # QA — reviews code, runs quality gates
@sm           # Story Manager — creates stories from epics
@po           # Product Owner — validates stories
@pm           # Product Manager — creates epics
@architect    # Architect — design decisions, technology selection
@devops       # DevOps — git push, PR creation, CI/CD (EXCLUSIVE)
@aios-master  # Master agent — framework governance
```

**Agent commands** (use `*` prefix):
```
*help                    # Show available commands
*create-story            # Create new story from epic
*task {name}             # Execute specific task
*develop {story-id}      # Start implementation (phase 3)
*qa-gate {story-id}      # Run QA checks (phase 4)
*qa-loop {story-id}      # Start QA Loop (iterative review-fix)
*push                    # Push to git (devops only)
```

### Story File Format

Every story lives in `docs/stories/` with this structure:
```markdown
# Story {Epic}.{ID} — Title

## Status
Draft / Ready / InProgress / InReview / Done

## Description
Problem/need explained here.

## Acceptance Criteria
- [ ] Given X, when Y, then Z
- [ ] Given A, when B, then C

## File List
- `src/components/MyComponent.tsx` (NEW)
- `src/hooks/useMyQuery.ts` (MODIFIED)
- `backend/app/my_module/` (NEW)

## Dev Notes (updated by @dev)
- [ ] Task 1
- [x] Task 2
- [ ] Task 3

## QA Results (filled by @qa)
Verdict: PASS / CONCERNS / FAIL / WAIVED
```

**Important:** Only @po can edit title, description, acceptance criteria. Only @dev can mark checkboxes.

### Authority Matrix

**Read full authority rules:** `.claude/rules/agent-authority.md`

Key restrictions:
- **@devops** (Gage) has EXCLUSIVE authority: `git push`, `gh pr create/merge`, CI/CD, MCP management
- **@pm** (Morgan) has EXCLUSIVE authority: epic creation, epic orchestration, spec writing
- **@po** (Pax) has EXCLUSIVE authority: story validation, backlog prioritization
- **@sm** (River) has EXCLUSIVE authority: story creation from epics
- **@dev** (Dex) can: `git add/commit`, `git branch`, story file updates (File List, checkboxes), implement
- **@dev** CANNOT: `git push`, `gh pr create`, story AC/scope edits

### CodeRabbit Integration

During @dev implementation (Phase 3):
```
CodeRabbit runs automatically after task completion
CRITICAL issues → auto-fix (max 2 iterations)
If CRITICAL persists → HALT, manual fix required
```

**Read full config:** `.claude/rules/coderabbit-integration.md`

### IDS (Incremental Development System)

Decision hierarchy: **REUSE > ADAPT > CREATE**

Before creating new components/patterns, check if existing ones can be reused. See `.claude/rules/ids-principles.md` for verification gates and override policy.

### Complete AIOS Documentation

All AIOS rules and workflows documented in:
- `.claude/CLAUDE.md` — Core framework, agent system, patterns
- `.claude/rules/agent-authority.md` — Agent boundaries, delegation
- `.claude/rules/story-lifecycle.md` — Story status transitions, phase details
- `.claude/rules/workflow-execution.md` — Task-first principle, all 4 workflows (SDC, QA Loop, Spec Pipeline, Brownfield Discovery)
- `.claude/rules/coderabbit-integration.md` — Self-healing code review
- `.claude/rules/ids-principles.md` — REUSE > ADAPT > CREATE decision hierarchy
- `.aios-core/` — Framework implementation (agents, tasks, templates, workflows)

## Critical Rules for AIOS Development

### 🚫 NEVER

These practices are forbidden:

1. **Implement without showing options first** — Always present choices as "1. X, 2. Y, 3. Z" format before implementing
2. **Delete/remove content without asking** — Always ask user before deleting anything
3. **Delete anything created in the last 7 days without explicit approval** — Check creation date, get written consent
4. **Change something that was already working** — Only modify if explicitly requested or broken
5. **Pretend work is done when it isn't** — Mark tasks complete only when fully finished and tested
6. **Process batch without validating the first** — Always validate first item of batch operations before proceeding
7. **Add features that weren't requested** — Implement exactly what's in acceptance criteria, nothing more
8. **Use mock data when real data exists in database** — Always query real data from DB when available
9. **Explain/justify when receiving criticism** — Just fix the issue without defensiveness or explanations
10. **Trust AI/subagent output without verification** — Always verify subagent results independently
11. **Build from scratch when similar exists in squad/s** — Check existing components and patterns first (IDS principle)

### ✅ ALWAYS

These practices are mandatory:

1. **Present options as "1. X, 2. Y, 3. Z" format** — When clarification needed, structure choices clearly for user decision
2. **Use AskUserQuestion tool for clarifications** — Don't assume; ask when requirements are ambiguous
3. **Check squads/ and existing components before creating new** — Query registry, search codebase for similar patterns (REUSE > ADAPT > CREATE)
4. **Read COMPLETE schema before proposing database changes** — Understand full schema implications before touching migrations
5. **Investigate root cause when error persists** — Don't bandaid; trace error to source and fix properly
6. **Commit before moving to next task** — Create git commit before starting new work (atomic commits)
7. **Create handoff in docs/sessions/YYYY-MM/ at end of session** — Document what was done, what's pending, context for next session

### Rule Enforcement

- **NEVER rules** block execution — violating these stops work immediately
- **ALWAYS rules** guide execution — violating these requires user confirmation
- Agent @aios-master can override with `--override-ids` flag (requires justification)
- Violations are logged for audit trail

## Debugging Tips

### Frontend Issues

**HMR not working?**
- Check that Vite is running with `--host 0.0.0.0` (see docker-compose.yml)
- Browser console will show connection status

**React Query not refetching?**
- Ensure hook invalidates cache: `queryClient.invalidateQueries({ queryKey: ['issues'] })`
- Check network tab for actual API requests

**Styling not applied?**
- Tailwind CSS v4 requires `@tailwindcss/vite` plugin (installed)
- Check that CSS is imported in main.tsx

**Type errors in components?**
- Run `npm run typecheck` to catch TypeScript issues before runtime
- Check src/types/ for shared interfaces

### Backend Issues

**Database migration errors?**
```bash
# Check migration status
docker compose exec backend alembic current
docker compose exec backend alembic history

# View migration scripts in alembic/versions/
```

**Async issues in tests?**
- Ensure test has `@pytest.mark.asyncio` decorator
- Use `async_client` fixture from conftest for HTTP tests
- Use `db_session` fixture for database access in tests

**WebSocket not connecting?**
- Backend WebSocket at `/ws/notifications/{user_id}` expects authenticated user_id
- Check browser DevTools Network → WS tab for connection status
- Backend logs connection in uvicorn output

**API 401 Unauthorized?**
- JWT token may be expired
- Check that refresh token flow works: expired access token → POST `/api/auth/refresh` with refresh token
- Check auth store (Zustand) has valid tokens

### Docker Issues

**Services won't start?**
```bash
# Check service status
docker compose ps

# View logs
docker compose logs backend
docker compose logs frontend
docker compose logs db

# Rebuild if dependency issues
docker compose down && docker compose up --build
```

**Database locked or won't connect?**
```bash
# Reset database completely (WARNING: destroys data)
make clean
make dev
```

## Key Files & Their Purpose

| File | Purpose |
|------|---------|
| `Makefile` | Quick commands (dev, test, lint, migrate, clean) |
| `docker-compose.yml` | Services: db (PostgreSQL), backend (FastAPI), frontend (Vite) |
| `frontend/vite.config.ts` | Vite build config, Vitest config, API proxy to backend |
| `frontend/package.json` | npm scripts (dev, test, lint, typecheck, build) |
| `backend/pyproject.toml` | Poetry dependencies, pytest/ruff config, Python version |
| `backend/alembic.ini` | Alembic migration config |
| `backend/app/main.py` | FastAPI app initialization, middleware, routes |
| `backend/.env` | Database URL and other secrets (not in git) |
| `.claude/CLAUDE.md` | AIOS framework rules, agent system, workflow patterns |
| `docs/stories/` | Development stories (AIOS story-driven development) |

## Common Tasks

| Task | Command |
|------|---------|
| Start development | `make dev` |
| Run all tests | `make test` |
| Run backend tests only | `docker compose exec backend pytest` |
| Run frontend tests only | `docker compose exec frontend npm test` |
| Lint backend | `docker compose exec backend ruff check .` |
| Lint frontend | `docker compose exec frontend npm run lint` |
| Check types (frontend) | `docker compose exec frontend npm run typecheck` |
| Create migration | `docker compose exec backend alembic revision --autogenerate -m "description"` |
| Apply migrations | `docker compose exec backend alembic upgrade head` |
| Seed database | `docker compose exec backend python -m app.seed` |
| Connect to database | `docker compose exec db psql -U flowboard -d flowboard` |
| View API docs | Open http://localhost:8000/docs |
| Stop services | `make stop` |
| Clean up (destroy volumes) | `make clean` |

## Environment Variables

**Backend (.env file)** — copy from `.env.example`:
```env
DATABASE_URL=postgresql+asyncpg://flowboard:flowboard_dev@db:5432/flowboard
SECRET_KEY=your-secret-key-change-in-production
ENVIRONMENT=development
```

**No frontend env vars needed** — backend URL configured in Vite proxy.

## Performance Considerations

- **Database**: Async SQLAlchemy with asyncpg for concurrent connections
- **Frontend**: React Query caching reduces unnecessary API calls
- **Drag/drop**: dnd-kit is performant for large lists
- **Notifications**: WebSocket is efficient for real-time updates

## Security Notes

- **JWT tokens**: Access token short-lived, refresh token long-lived
- **RBAC**: Role checks in service layer before data access
- **File uploads**: Validated and stored in `uploads/` volume
- **Password hashing**: bcrypt via passlib
- **CORS**: Backend should configure CORS for production domains

## Session Handoff Template

At end of session, create `docs/sessions/YYYY-MM/session-{date}.md`:

```markdown
# Session Handoff — {Date}

## Completed
- [x] Task/story ID: {brief description}
- [x] Task/story ID: {brief description}

## In Progress (Paused)
- [ ] Task/story ID: {description, current status, blocker if any}
- [ ] Task/story ID: {description, current status}

## Next Steps (for next session)
1. Resume {story-id} from checkpoint X
2. Start {story-id} (ready for development)
3. Check CI/CD status on {PR-number}

## Important Context
- Database state: {any seed data or migrations applied}
- Environment variables: {any .env changes needed}
- Git status: {current branch, any uncommitted work}
- Performance notes: {any performance measurements or debugging findings}
- Architecture decisions: {if any ADR or design choice was made}

## Files Modified
- `src/components/X.tsx`
- `backend/app/Y/router.py`
- `docs/stories/E2.S3.story.md`

## Tests Status
- Frontend: {all passing / X failing / N skipped}
- Backend: {all passing / X failing / N skipped}

## CI/CD
- Latest run: {link or status}
- Issues: {any failing checks}

## Session Agent
Worked with: @dev / @qa / @architect / @pm / other
```

---

*FlowBoard CLAUDE.md — Full-Stack Agile Project Management with AIOS*
