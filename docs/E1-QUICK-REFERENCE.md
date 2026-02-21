# E1 Quick Reference — Phase 1 Quick Wins

**Duration:** 3-4 weeks | **Team:** 1-2 devs | **Impact:** 20-30% perf ↑

---

## The 7 Stories at a Glance

| Story | Title | Effort | Owner | Impact |
|-------|-------|--------|-------|--------|
| E1.1 | Rate Limiting Middleware | 1w | BE | DDoS protection |
| E1.2 | File Upload Validation | 1w | BE | Security fix |
| E1.3 | N+1 Query Fixes | 1-2w | BE | Major perf win |
| E1.4 | Mobile Kanban Optimization | 2-3w | FE | Fix mobile UX |
| E1.5 | Loading Skeleton Screens | 1-2w | FE | Better UX |
| E1.6 | Connection Pool Tuning | 1-2d | BE | Quick win |
| E1.7 | Statistics Scheduling | 1d | BE | Query optimization |

---

## Performance Targets

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| P95 Latency | 500ms | 350ms | ↓ 30% |
| DB CPU | 60% | 40% | ↓ 20% |
| Mobile Kanban | ❌ Broken | ✅ Functional | Fixed |
| Skeleton Screens | ❌ None | ✅ All pages | Added |

---

## First Story Recommendations

### Fastest Path (2-3 days)
```
E1.6 (Connection Pool) → 1-2 days
E1.7 (Statistics) → 1 day
```

### Balanced Path (Week by week)
```
Week 1: E1.6 + E1.1 + E1.2 + E1.5 (in parallel)
Week 2: E1.3 (N+1 fixes)
Week 3: E1.4 (Mobile)
Week 4: Testing + docs
```

---

## Files to Modify

### Backend
```
backend/
├── app/api/middleware/rate_limiter.py (NEW)
├── app/services/validation.py (FILE VALIDATION)
├── app/services/issues.py (N+1 FIXES)
├── config.py (CONNECTION POOL)
├── scripts/schedule_stats.py (NEW)
└── tests/
    ├── test_rate_limiting.py (NEW)
    └── test_file_validation.py (NEW)
```

### Frontend
```
frontend/
├── src/
│   ├── components/Kanban/KanbanBoard.tsx (MOBILE RESPONSIVE)
│   ├── components/common/SkeletonLoader.tsx (NEW)
│   ├── pages/*.tsx (ADD SKELETON SCREENS)
│   └── __tests__/
│       ├── mobile-kanban.test.tsx (NEW)
│       └── skeleton-screens.test.tsx (NEW)
```

---

## Quality Gates (Every Commit)

```bash
# Frontend
npm run lint       # Must pass
npm run typecheck  # Must pass
npm test           # Must pass

# Backend
black .            # Format
isort .            # Sort imports
flake8 .           # Lint
pytest             # Tests must pass
```

---

## Key Commands

```bash
# Start dev environment
make dev

# Run tests
npm test              # frontend
pytest                # backend

# Type checking
npm run typecheck     # frontend

# Code quality
npm run lint          # frontend
black app/            # backend
isort app/            # backend
```

---

## Quick Help

| Question | Answer |
|----------|--------|
| Where do I start? | Pick E1.6 (fastest) or E1.1 (most useful) |
| How do I create story? | `@sm *draft` → select Epic E1, Story ID |
| How do I update story? | Edit `docs/stories/1.{N}.story.md` directly |
| When do I commit? | After each story completion |
| What's the AC? | Read story file acceptance criteria section |
| Tests failing? | Run `npm ci` or `pip install -r requirements.txt` |
| Need help? | Ask @architect (design), @data-engineer (DB), @qa (tests) |

---

## Success = ✅ All Stories Done

When you've completed all 7 stories with:
- ✅ All acceptance criteria met
- ✅ 100% test coverage on new code
- ✅ All quality gates passing
- ✅ Performance targets hit
- ✅ Zero regressions

Then E1 is **COMPLETE** and Phase 2 begins! 🎉

---

**Full details:** → Read `docs/epics/E1-Phase1-Quick-Wins.story.md`
**Setup help:** → Read `docs/DEVELOPMENT-HANDOFF.md`
