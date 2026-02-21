# Development Handoff — Brownfield Discovery Complete

**Date:** 2026-02-21
**From:** @architect (Aria) + Brownfield Discovery Workflow
**To:** @dev (Dex)
**Status:** Ready for Sprint Planning & Development

---

## Quick Start

**You're starting with:** Epic E1 (Phase 1 — Quick Wins)
**Duration:** 3-4 weeks
**Team Size:** 1-2 developers (1 backend, 1 frontend)
**Expected Impact:** 20-30% performance improvement, $300/mo savings

**Next 30 minutes:**
1. Read "Context for Development" section below
2. Review Epic E1 in `docs/epics/E1-Phase1-Quick-Wins.story.md`
3. Pick your first story (E1.1 or E1.2 recommended)
4. Start with story framework: `@sm *draft` or open existing story

---

## Context for Development

### What Happened

We just completed a **comprehensive 10-phase brownfield architecture discovery** of the FlowBoard codebase. This identified **25 technical debts** organized into **3 phased epics (6-8 months of work)**.

**The Good News:** FlowBoard has solid architecture (Grade **A-, 8.5/10**). With targeted optimizations, it can scale from 500 → 50K+ users.

**The Plan:**
- **Phase 1 (E1):** Quick wins, low risk, immediate ROI (weeks 1-4)
- **Phase 2 (E2):** Core infrastructure, unlocks scaling (weeks 5-12)
- **Phase 3 (E3):** Enterprise features (weeks 13-20)

### Current State of the Project

**Architecture Grade:** A- (8.5/10)
**Current Users:** 50-500 per instance
**Current Performance:** P95 latency ~500ms, Database CPU 60%
**Critical Issue:** 50-70% of database load is from N+1 queries and lack of caching

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite + Zustand + React Query
- Backend: FastAPI + Python 3.11 + SQLAlchemy 2.0 async
- Database: PostgreSQL 15 + Alembic migrations
- Infrastructure: Docker Compose (3 services: db, backend, frontend)

**Key Files to Know:**
```
backend/
├── app/
│   ├── api/             # API endpoints
│   ├── services/        # Business logic
│   ├── db/              # Database models & queries
│   ├── auth/            # Authentication
│   └── models/          # SQLAlchemy ORM models
├── tests/               # pytest tests
└── alembic/             # Database migrations

frontend/
├── src/
│   ├── pages/           # Page components
│   ├── components/      # Reusable components
│   ├── hooks/           # Custom React hooks
│   ├── contexts/        # Context API
│   └── styles/          # TailwindCSS
├── __tests__/           # Vitest tests
└── package.json         # Dependencies
```

---

## Your First Epic: E1 (Phase 1 — Quick Wins)

### What You're Building

7 interconnected improvements that deliver 20-30% performance improvement with minimal risk:

1. **Rate Limiting** (1 week) — Prevent DDoS attacks
2. **File Upload Validation** (1 week) — Security fix
3. **N+1 Query Fixes** (1-2 weeks) — Major performance win
4. **Mobile Kanban Optimization** (2-3 weeks) — Fix broken mobile
5. **Loading Skeleton Screens** (1-2 weeks) — Better UX
6. **Connection Pool Tuning** (1-2 days) — Quick win
7. **Statistics Scheduling** (1 day) — Query planner optimization

### Why This Order Matters

```
Week 1:  Rate limiting (BE) + Skeleton screens (FE)
         File validation (BE) in parallel

Week 2:  N+1 query fixes (BE)
         Mobile Kanban optimization (FE)

Week 3:  Mobile polish + accessibility testing (FE)
         Connection pool + Statistics (BE)

Week 4:  Testing, hardening, documentation
         Deploy to production
```

### Success Criteria for E1

**When E1 is DONE, you'll have:**
- ✅ P95 latency: 500ms → 350ms (30% improvement)
- ✅ Database CPU: 60% → 40% (20% reduction)
- ✅ Mobile Kanban: Fully functional on phones
- ✅ All tests passing (100% coverage)
- ✅ Zero rate limit bypass vulnerabilities
- ✅ Skeleton screens on all pages
- ✅ Performance baselines established for Phase 2

---

## Documentation to Review

### Essential (Read First)
1. **`docs/epics/E1-Phase1-Quick-Wins.story.md`** — Your main epic document
   - All 7 stories with detailed acceptance criteria
   - Effort estimates, dependencies, risks
   - Files to modify/create

2. **`docs/technical-debt-assessment.md`** — The roadmap (Phases 1-3)
   - Why each phase was chosen
   - Timeline & resource plan
   - Success metrics

### Reference (As Needed)
- `docs/SCHEMA.md` — Database schema audit
- `docs/frontend/frontend-spec.md` — Frontend component inventory
- `docs/TECHNICAL-DEBT-REPORT.md` — Executive summary (for context)

### Architecture Deep Dives (If Curious)
- `docs/architecture/system-architecture.md` — Complete system analysis
- `docs/architecture/BROWNFIELD-DISCOVERY-LOG.md` — How we got here

---

## Development Environment Setup

### Prerequisites (Should Already Be Done)

```bash
# Frontend dependencies
cd frontend
npm install
npm run build

# Backend dependencies
cd backend
python -m venv venv
source venv/bin/activate  # or on Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Start Development Services

```bash
# From project root
make dev
# OR manually:
docker-compose up -d
```

This starts:
- PostgreSQL 15 on port 5433
- FastAPI backend on port 8000
- Vite frontend on port 5173

### Run Tests Before You Start

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
pytest

# Type checking
npm run typecheck  # frontend
mypy app/         # backend (if configured)
```

### Quality Gates (You'll Run These Frequently)

```bash
# Frontend
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm test           # Vitest

# Backend
pytest             # Unit + integration tests
black .            # Code formatting
isort .            # Import sorting
flake8 .           # Linting
```

---

## How to Start a Story

Each story in E1 follows this pattern:

### 1. Pick Your First Story
Recommended starting points:
- **E1.6 (Connection Pool Tuning)** — Fastest, 1-2 days, low risk
- **E1.1 (Rate Limiting)** — Standard effort, 1 week, well-defined
- **E1.4 (Mobile Kanban)** — Higher complexity, 2-3 weeks, visible impact

### 2. Activate @sm to Create Story
```
@sm *draft
# Select: Epic E1, Story E1.6 (or your choice)
```

This creates a story file like: `docs/stories/1.6.story.md`

### 3. Read the Story Acceptance Criteria
The story file has detailed AC telling you exactly what "done" means.

### 4. Create a Feature Branch
```bash
git checkout -b feat/story-e1-6-connection-pool
```

### 5. Start Implementing
- Update story file as you complete AC items
- Commit frequently with story ID in message
- Run quality gates regularly

### 6. When Story is Done
```
@sm *qa-gate {story-id}
```

This triggers QA review. QA will:
- Check all AC met
- Run tests
- Verify no regressions
- Approve or request changes

---

## Critical Rules & Patterns

### NEVER ❌
- Start story without reading AC (you'll build wrong thing)
- Commit without running lint + tests
- Skip quality gates ("I'll fix it later" = debt)
- Implement outside story scope (out = not included)
- Break tests (all tests must pass before commit)

### ALWAYS ✅
- Update story file's File List as you modify files
- Mark AC checkboxes as you complete them
- Commit with story ID: `feat: {description} [Story E1.6]`
- Run quality gates: lint → typecheck → test → build
- Ask if AC is ambiguous (don't guess)

### Code Patterns to Follow

**Database Queries (Backend):**
```python
# ❌ BAD: N+1 queries
for issue in issues:
    print(issue.project.name)  # N+1!

# ✅ GOOD: Eager loading
from sqlalchemy.orm import selectinload
issues = db.query(Issue).options(
    selectinload(Issue.project)
).all()
```

**Async Operations (Backend):**
```python
# ✅ GOOD: Use async/await
async def get_issues(project_id: str):
    issues = await db.execute(
        select(Issue).where(Issue.project_id == project_id)
    )
    return issues.scalars().all()
```

**React Components (Frontend):**
```tsx
// ✅ GOOD: Use hooks, proper typing
const IssueList: React.FC<IssueListProps> = ({ projectId }) => {
  const { data: issues, isLoading } = useIssuesQuery(projectId)

  if (isLoading) return <SkeletonLoader />
  return <div>{issues.map(i => <IssueCard key={i.id} issue={i} />)}</div>
}
```

---

## Files You'll Modify Most

### Backend (E1 Focus)
- `backend/app/api/middleware/` — Rate limiting middleware
- `backend/app/services/validation.py` — File upload validation
- `backend/app/services/issues.py` — N+1 query fixes
- `backend/config.py` — Connection pool configuration
- `backend/tests/` — New tests for all changes

### Frontend (E1 Focus)
- `frontend/src/components/Kanban/KanbanBoard.tsx` — Mobile responsive
- `frontend/src/components/common/SkeletonLoader.tsx` — New
- `frontend/src/pages/` — Add skeleton screens to all pages
- `frontend/src/__tests__/` — New tests

### Database
- `backend/alembic/versions/` — Any schema changes (minimal for E1)

---

## Performance Targets (Your Metrics)

### Before Starting
You should establish **baselines**:

```bash
# Measure current performance
# P95 latency, DB CPU usage, query counts

# Example baselines:
P95 Latency: 500ms
DB CPU: 60%
N+1 queries: Yes (many)
Mobile Kanban: Broken
```

### After E1
**You're aiming for:**
- ✅ P95 Latency: 350ms (30% improvement from 500ms)
- ✅ DB CPU: 40% (20% reduction from 60%)
- ✅ Mobile Kanban: Functional
- ✅ All tests passing
- ✅ Rate limiting working
- ✅ File validation blocking bad uploads
- ✅ Skeleton screens visible on all pages

### How to Measure
```bash
# Performance testing
# Use browser DevTools for frontend latency
# Use database logs for query analysis
# Use monitoring dashboard (if available)
```

---

## Getting Help

### If You're Stuck

1. **Unclear AC?** Ask @po (Product Owner) to clarify
2. **Architecture question?** Ping @architect (Aria)
3. **Database design?** Ask @data-engineer (Dara)
4. **Test/quality issue?** Ask @qa
5. **General help?** Type `/help` for Claude Code

### Common Issues & Solutions

**Issue: Tests failing**
```bash
# Clear cache and reinstall
npm ci  # frontend
pip install --upgrade -r requirements.txt  # backend
pytest --cache-clear
```

**Issue: Docker services not running**
```bash
docker-compose ps
docker-compose up -d
docker-compose logs -f
```

**Issue: Database migration needed**
```bash
# Backend only
cd backend
alembic upgrade head
```

**Issue: Port already in use**
```bash
# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
# Or change port in .env
```

---

## Workflow for Committing

### Before Every Commit
```bash
# 1. Update story file (mark AC as [x])
# 2. Run linting
npm run lint    # frontend
black app/      # backend

# 3. Run tests
npm test        # frontend
pytest          # backend

# 4. Type check
npm run typecheck  # frontend
# mypy app/       # backend (if needed)

# 5. Build (to catch any issues)
npm run build   # frontend
```

### Commit Format
```bash
git add .
git commit -m "feat: brief description [Story E1.6]

- Detailed change 1
- Detailed change 2
- Reference AC items completed

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

### Push to Remote
```bash
git push origin feat/story-e1-6-connection-pool
```

Then create PR (or wait for @devops to handle it).

---

## Your Sprint Plan (Suggested)

### Week 1: Foundation
- **Day 1-2:** Connection Pool Tuning (E1.6) + Rate Limiting (E1.1)
- **Day 3-5:** File Upload Validation (E1.2) + Skeleton Screens (E1.5)

### Week 2: Major Work Begins
- **Day 1-5:** N+1 Query Fixes (E1.3) — Most complex story

### Week 3: Frontend Sprint
- **Day 1-5:** Mobile Kanban Optimization (E1.4) — FE heavy

### Week 4: Polish & Testing
- **Day 1-3:** Mobile accessibility, final testing
- **Day 4-5:** Documentation, production readiness

### Parallel (All Weeks)
- Run quality gates after each story
- Update baselines as metrics improve
- Document patterns discovered

---

## What Happens After E1

Once E1 is **DONE** (✅ all acceptance criteria met):

1. **Phase 2 (E2) Begins** — Core infrastructure (8 weeks)
   - Redis caching layer
   - RLS policies
   - Full-text search
   - Design system

2. **Your Role Expands** — You'll likely be 2+ devs
   - Parallel tracks (backend + frontend)
   - More complex architectural changes

3. **Expected Results** — P95 latency <200ms, support 5K users, enterprise-ready

---

## One More Thing

### Keep an Eye On:

1. **Database Connections** — Don't open too many (connection pool limit)
2. **Cache Coherency** — Data consistency with N+1 fixes
3. **Mobile Testing** — Real devices, not just browser
4. **Performance Regression** — Measure before + after each change

---

## Summary

You have everything you need:
- ✅ Complete technical context (brownfield discovery)
- ✅ 7 stories with detailed AC
- ✅ Development environment ready (docker-compose)
- ✅ Quality gates and testing framework
- ✅ Performance targets to hit
- ✅ Support team (architect, data-engineer, QA, etc.)

**Next Step:** Open `docs/epics/E1-Phase1-Quick-Wins.story.md`, pick your first story, and start! 🚀

---

**Questions?** Ask @sm (Story Manager) or ping @architect for architecture questions.

**Ready?** → `@sm *draft` to create your first story.

Good luck! 💪

---

*Handoff prepared: 2026-02-21*
*From: @architect (Aria) + Brownfield Discovery Workflow*
*To: @dev (Dex)*
