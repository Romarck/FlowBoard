# Epic E1: Phase 1 — Quick Wins

**Status:** Ready
**Priority:** P0 (Critical)
**Epic ID:** E1
**Timeline:** Weeks 1-4 (3-4 weeks)
**Team Size:** 1-2 developers (1 backend, 1 frontend)
**Expected Impact:** 20-30% performance improvement, $300/mo cost savings

---

## Summary

Quick, high-ROI technical debt fixes that require minimal infrastructure changes. These are "quick wins" that unblock Phase 2 work and provide immediate performance benefits without major architectural changes.

**Business Value:**
- Immediate cost savings from improved database utilization
- Better mobile user experience
- Foundation for future scaling initiatives
- Demonstrates engineering momentum to stakeholders

---

## Description

### What is this Epic about?

This epic addresses 7 critical technical debts that can be resolved in 3-4 weeks with minimal risk:

1. **Rate Limiting** (1 week) - Prevent DDoS attacks, stabilize API
2. **File Upload Validation** (1 week) - Security fix, prevent malicious uploads
3. **N+1 Query Fixes** (1-2 weeks) - Critical performance issue, quick database wins
4. **Mobile Kanban Optimization** (2-3 weeks) - Fix broken mobile experience
5. **Loading Skeleton Screens** (1-2 weeks) - Better perceived performance
6. **Connection Pool Tuning** (1-2 days) - Low-hanging performance fruit
7. **Statistics Scheduling** (1 day) - Query planner optimization

### Why now?

- These fixes unblock Phase 2 work (caching layer, RLS policies)
- Mobile users are being turned away (20% of user base)
- Performance degradation risk with growing user base
- Database under 60% CPU pressure due to N+1 queries

### What domains are affected?

- **Backend:** Rate limiting middleware, database connection management, statistics refresh
- **Frontend:** Mobile responsive design, Kanban board UX, loading states
- **Database:** Connection pool configuration, index optimization for statistics
- **DevOps:** No infrastructure changes needed

---

## Acceptance Criteria

### Must Have (Definition of Done)

**Backend:**
- [ ] Rate limiting middleware implemented and tested under load
- [ ] File upload validation (type, size, content) in place
- [ ] All identified N+1 query patterns fixed and verified with logs
- [ ] Connection pool configured for 100+ concurrent users without degradation
- [ ] PostgreSQL statistics auto-refresh scheduled daily
- [ ] All tests passing (pytest: 100% on modified code)
- [ ] Zero rate limit bypass vulnerabilities in testing

**Frontend:**
- [ ] Kanban board renders single column on mobile (< 640px)
- [ ] Touch-friendly drag-drop interface on mobile
- [ ] All page loads show skeleton screens during data fetch
- [ ] Mobile navigation responsive (sidebar hidden, bottom tabs visible)
- [ ] Linting passes (npm run lint)
- [ ] Type checking passes (npm run typecheck)
- [ ] 3+ browsers tested (Chrome, Safari, Firefox)

### Success Metrics

- **Performance:** P95 latency 500ms → 350ms (30% improvement)
- **Database Load:** CPU 60% → 40% (20% reduction)
- **Mobile:** Kanban usable on mobile (currently broken)
- **Uptime:** 99.9% during peak hours
- **Cost:** Database CPU reduction saves ~$300/month
- **User Satisfaction:** Mobile users can complete workflows

### Quality Gates

- [ ] All tests passing (100% of modified code covered)
- [ ] No security vulnerabilities (CodeRabbit: zero CRITICAL issues)
- [ ] Performance benchmarks met (latency targets)
- [ ] Accessibility maintained (WCAG A minimum)
- [ ] No regressions in existing functionality

---

## Scope

### IN (Included)

✅ Rate limiting middleware
✅ File upload security validation
✅ N+1 query pattern fixes (all identified instances)
✅ Mobile Kanban board optimization
✅ Loading skeleton screens (all pages)
✅ Connection pool configuration tuning
✅ PostgreSQL statistics scheduler
✅ Comprehensive test coverage for changes

### OUT (Not Included)

❌ Caching layer (Phase 2)
❌ Full-text search optimization (Phase 2)
❌ Dark mode (Phase 3)
❌ WebSocket refactor (Phase 3)
❌ New features/functionality
❌ UI redesign (handled separately)

---

## Dependencies

### Prerequisites
- ✅ Development environment set up (docker-compose running)
- ✅ PostgreSQL 15+ with existing schema
- ✅ All tests passing (current baseline established)
- ✅ Performance baselines measured (current P95, CPU usage)

### Blocking Phase 2
- **None** — Phase 1 is independent. Phase 2 work can start as Phase 1 completes.

### Internal Dependencies
1. **Connection Pool Tuning** → **N+1 Fixes** (better connection management supports faster queries)
2. **Statistics Scheduling** → **N+1 Fixes** (ensures query planner works optimally)
3. **File Validation** → Can start immediately, no dependencies

---

## Stories Breakdown

### Story E1.1: Rate Limiting Middleware
**Effort:** 1 week | **Dev:** Backend | **Priority:** P0

- Implement token bucket algorithm
- 100 requests/minute per API endpoint
- Custom response for rate limit exceeded
- Test under simulated load
- Document rate limit headers in API docs

### Story E1.2: File Upload Validation
**Effort:** 1 week | **Dev:** Backend | **Priority:** P0

- Validate file type (whitelist: pdf, doc, docx, xls, xlsx, csv, jpg, png)
- Enforce max file size (50MB)
- Scan for malicious content patterns
- Log all upload attempts (for audit trail)
- Return clear error messages on validation failure

### Story E1.3: N+1 Query Fixes
**Effort:** 1-2 weeks | **Dev:** Backend | **Priority:** P0

- Identify all N+1 patterns (use query logs, APM if available)
- Fix parent-child queries with proper JOINs or select_in_load
- Add query performance monitoring/logging
- Verify with before/after metrics
- Document query patterns for future prevention

### Story E1.4: Mobile Kanban Optimization
**Effort:** 2-3 weeks | **Dev:** Frontend | **Priority:** P0

- Single-column layout on mobile (< 640px)
- Touch-optimized drag-drop (larger touch targets)
- Responsive navigation (hamburger menu, bottom tabs)
- Proper spacing for mobile usability
- Test on real iOS + Android devices

### Story E1.5: Loading Skeleton Screens
**Effort:** 1-2 weeks | **Dev:** Frontend | **Priority:** P0

- Create reusable skeleton component
- Apply to: Issue list, Kanban board, Sprint view, Dashboard
- Fade transition from skeleton to actual content
- Prevent layout shift (CLS = 0)
- Test accessibility (screen reader handling)

### Story E1.6: Connection Pool Tuning
**Effort:** 1-2 days | **Dev:** Backend | **Priority:** P0

- Analyze asyncpg pool size (current vs. optimal)
- Set pool_size based on expected concurrency
- Add pool monitoring/alerting
- Test with load generator
- Document configuration

### Story E1.7: PostgreSQL Statistics Scheduler
**Effort:** 1 day | **Dev:** Backend | **Priority:** P0

- Schedule `ANALYZE` job daily (pg_cron or cron + script)
- Update table statistics for query planner
- Verify job runs without errors
- Document in runbook

---

## Effort Estimation

| Item | Backend | Frontend | Duration | Risk |
|------|---------|----------|----------|------|
| Rate Limiting | 4-5d | — | 1w | Low |
| File Validation | 3-4d | — | 1w | Low |
| N+1 Query Fixes | 5-8d | — | 1-2w | Medium |
| Mobile Kanban | — | 8-12d | 2-3w | Medium |
| Skeleton Screens | — | 5-8d | 1-2w | Low |
| Connection Pool | 1-2d | — | 1-2d | Low |
| Statistics | 1d | — | 1d | Low |
| **TOTAL** | **19-23 days** | **13-20 days** | **3-4 weeks** | **Low-Medium** |

**Team Configuration:**
- **Week 1:** 1 BE + 1 FE (rate limiting, validation, skeleton screens)
- **Week 2:** 1 BE + 1 FE (N+1 fixes, mobile optimization)
- **Weeks 3-4:** 1-2 FE (mobile polish), 1 BE (tuning + stats)

---

## Risk Assessment

### Medium Risks

**Risk: N+1 Query Changes Break Other Code**
- Mitigation: Comprehensive test suite before changes
- Mitigation: Feature flags for gradual rollout
- Mitigation: Database replication for testing

**Risk: Mobile Changes Break Desktop**
- Mitigation: Parallel development tracks
- Mitigation: Comprehensive browser testing
- Mitigation: Responsive design system

### Low Risks

**Risk: Rate Limiting Too Aggressive**
- Mitigation: Configurable limits per endpoint
- Mitigation: Whitelist for internal services
- Mitigation: Gradual rollout with monitoring

**Risk: File Validation Blocks Legitimate Files**
- Mitigation: Clear error messages
- Mitigation: Support ticket process for issues
- Mitigation: Configurable whitelist

---

## Success Metrics

### Performance Targets
- **P95 Latency:** 500ms → 350ms (30% improvement) ✅
- **Database CPU:** 60% → 40% (20% reduction) ✅
- **Mobile Users:** 0% complete workflows → 60% ✅
- **Cost Savings:** ~$300/month from DB optimization ✅

### Quality Targets
- **Test Coverage:** 100% of modified code
- **Security:** Zero CodeRabbit CRITICAL findings
- **Accessibility:** WCAG A maintained
- **Browser Compatibility:** Chrome, Safari, Firefox, Edge

### User Experience
- **Mobile Usability:** Kanban board functional on phones
- **Perceived Performance:** Skeleton screens visible, not blank pages
- **Reliability:** No rate limit false positives

---

## Definition of Done

For this epic to be marked **COMPLETE**, all of the following must be true:

1. ✅ All 7 stories marked DONE (acceptance criteria met)
2. ✅ All tests passing (pytest + npm test)
3. ✅ Code review approved (linting + type checking)
4. ✅ Performance benchmarks verified
5. ✅ Deployed to staging, tested 1 week
6. ✅ Zero regressions in existing functionality
7. ✅ Documentation updated (API docs, runbooks)
8. ✅ Team trained on new patterns/configurations
9. ✅ Ready for Phase 2 work to begin

---

## Phase 2 Prerequisites

For Phase 2 (Core Infrastructure) to start, this epic must be **COMPLETE** and:

- [ ] Performance baselines established (latency, CPU, cost)
- [ ] Mobile test framework in place (for future work)
- [ ] Connection pool stable under sustained load
- [ ] Database statistics auto-refresh proven reliable
- [ ] Team familiar with new patterns (rate limiting, validation)

---

## Timeline

```
Week 1:  Rate limiting (BE) + Skeleton screens (FE)
         File validation (BE) in parallel

Week 2:  N+1 query fixes (BE)
         Mobile Kanban optimization (FE)

Week 3:  Mobile polish + accessibility testing (FE)
         Connection pool + Statistics (BE)

Week 4:  Testing, hardening, documentation
         Deploy to production
         Monitor for issues
```

---

## Files to Modify

### Backend
- `backend/app/api/middleware/rate_limiter.py` (new)
- `backend/app/services/validation.py` (file upload validation)
- `backend/app/services/issues.py` (N+1 query fixes)
- `backend/config.py` (connection pool configuration)
- `backend/scripts/schedule_stats.py` (new, statistics scheduler)

### Frontend
- `frontend/src/components/Kanban/KanbanBoard.tsx` (mobile responsive)
- `frontend/src/components/common/SkeletonLoader.tsx` (new)
- `frontend/src/pages/IssuesPage.tsx` (skeleton screens)
- `frontend/src/pages/BoardPage.tsx` (skeleton screens + mobile)
- `frontend/src/pages/DashboardPage.tsx` (skeleton screens)

### Database
- `backend/alembic/versions/` (connection pool config script, statistics job)

### Tests
- `backend/tests/test_rate_limiting.py` (new)
- `backend/tests/test_file_validation.py` (new)
- `frontend/src/__tests__/mobile-kanban.test.tsx` (new)
- `frontend/src/__tests__/skeleton-screens.test.tsx` (new)

---

## Change Log

| Date | Status | Notes |
|------|--------|-------|
| 2026-02-21 | Created | Epic created from Brownfield Discovery Phase 10 |

---

**Epic Owner:** @sm (Story Manager)
**Engineering Lead:** TBD
**QA Lead:** TBD
**Status:** Ready for Sprint Planning
