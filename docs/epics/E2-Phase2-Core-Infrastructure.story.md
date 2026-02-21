# Epic E2: Phase 2 — Core Infrastructure

**Status:** Ready
**Priority:** P1 (High)
**Epic ID:** E2
**Timeline:** Weeks 5-12 (2 months)
**Team Size:** 2-3 developers (2 backend, 1 frontend)
**Expected Impact:** 50-70% database load reduction, 10x search speed improvement, enterprise-scale security
**Prerequisite:** Epic E1 (Phase 1) must be COMPLETE

---

## Summary

Core infrastructure improvements enabling horizontal scaling and enterprise-grade security. This phase addresses scalability bottlenecks identified in Phase 1 and adds capabilities required for SMB-to-enterprise growth.

**Business Value:**
- Support 5K+ concurrent users per instance (vs. 500 currently)
- Enterprise-grade security with row-level access control
- Search performance: 5-10s → <500ms (instant results)
- Database CPU: 40% → 20% (from Phase 1 → Phase 2)
- Enables enterprise sales and compliance requirements

---

## Description

### What is this Epic about?

This epic addresses 10 critical/high infrastructure debts that require significant engineering effort but unlock enterprise capabilities:

1. **Redis Caching Layer** (3-4 weeks) - 50% DB load reduction
2. **PostgreSQL Full-Text Search** (2-3 weeks) - Instant search results
3. **Row-Level Security (RLS) Policies** (3-4 weeks) - Enterprise security requirement
4. **Design System Formalization** (2-3 weeks) - UI consistency, faster development
5. **Accessibility Audit & Fixes** (1-2 weeks) - WCAG AA compliance
6. **CHECK Constraints** (1 week) - Data integrity enforcement

### Why now?

- Phase 1 established performance baselines and quick wins
- Database bottleneck is clearly caching (50-70% of load from repeated queries)
- LIKE search too slow for growing datasets (5-10 second queries)
- Enterprise customers demanding role-based access control
- Security gaps prevent compliance certifications
- Design system will accelerate Phase 3 development

### Critical Dependencies

- **Depends on E1:** Connection pool tuned, N+1 queries fixed
- **Enables E3:** WebSocket scaling, enterprise features
- **Unblocks Sales:** Enterprise certifications, customer features

### Team Coordination

**Backend Team (2 devs):**
- **Dev 1:** Redis caching (parallel with Dev 2)
- **Dev 2:** RLS policies (parallel with Dev 1)
- **Together:** FTS implementation, CHECK constraints

**Frontend Team (1 dev):**
- Design system documentation
- Accessibility testing and fixes
- Component migration to design system

---

## Acceptance Criteria

### Must Have (Definition of Done)

**Backend - Caching Layer:**
- [ ] Redis cache layer implemented and integrated
- [ ] Cache invalidation strategy working correctly
- [ ] All high-frequency queries cached (issues, projects, comments)
- [ ] Cache hit rate > 80% on production-like load
- [ ] Monitoring/alerting for cache performance
- [ ] Zero data consistency issues in testing
- [ ] Feature flags for gradual rollout

**Backend - Full-Text Search:**
- [ ] PostgreSQL FTS implemented (GIN index)
- [ ] Search queries: 5-10s → <500ms
- [ ] Supports multi-field search (title, description, comments)
- [ ] Filters work with search (status, priority, assignee)
- [ ] Ranking/relevance properly implemented
- [ ] Tests for search accuracy and performance

**Backend - RLS Policies:**
- [ ] All tables protected by RLS policies
- [ ] Users can only access their own projects/issues
- [ ] Admins can view/modify any data
- [ ] Project members have appropriate permissions
- [ ] No RLS bypass vulnerabilities identified
- [ ] Comprehensive testing with real data
- [ ] Rollback procedures documented and tested

**Database:**
- [ ] CHECK constraints on status, priority, issue_type
- [ ] Enforces valid enum values at database layer
- [ ] Migration handles existing data
- [ ] Tests verify constraint enforcement

**Frontend - Design System:**
- [ ] Component library documented in Storybook
- [ ] Color system formalized (12 colors minimum)
- [ ] Typography system defined (headings, body, code)
- [ ] Spacing system documented (8px base unit)
- [ ] 80% of existing components migrated
- [ ] Style guide published
- [ ] Design tokens exported for developers

**Frontend - Accessibility:**
- [ ] WCAG 2.1 AA compliance verified (Axe audit)
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader compatibility tested
- [ ] Color contrast ratios meet AA standards
- [ ] Focus indicators visible
- [ ] Alt text on all images
- [ ] Form labels properly associated

### Success Metrics

- **Scalability:** Support 5K+ concurrent users per instance (vs. 500)
- **Performance:** P95 latency 350ms → 200ms (43% improvement)
- **Database:** CPU 40% → 20%, query count -50%
- **Search:** Speed 5-10s → <500ms, relevance score > 0.8
- **Accessibility:** WCAG AA compliance, 100% of pages scanned
- **Cache Hit Rate:** > 80% on production-like workload
- **RLS Coverage:** 100% of tables protected, zero bypass vulnerabilities

### Quality Gates

- [ ] All tests passing (100% coverage on modified code)
- [ ] Zero CodeRabbit CRITICAL/HIGH security issues
- [ ] Performance benchmarks met (latency, throughput targets)
- [ ] WCAG AA compliance verified
- [ ] RLS policies tested with multiple user roles
- [ ] Cache invalidation stress tested
- [ ] Load testing: 5K concurrent users = stable

---

## Scope

### IN (Included)

✅ Redis cache layer (architecture + implementation)
✅ Cache invalidation strategies for all modified entities
✅ PostgreSQL FTS configuration (GIN indexes, ranking)
✅ RLS policy implementation (all tables)
✅ CHECK constraints (enums: status, priority, issue_type)
✅ Design system formalization (Storybook)
✅ Accessibility audit and remediation (WCAG AA)
✅ Comprehensive testing for all components
✅ Feature flags for gradual rollout

### OUT (Not Included)

❌ Elasticsearch or other search engines (PostgreSQL FTS only)
❌ Distributed caching (Redis only, single instance)
❌ Soft deletes (Phase 3+)
❌ Dark mode (Phase 3)
❌ WebSocket refactor (Phase 3)
❌ Custom field support
❌ Advanced workflow automation

---

## Dependencies

### Prerequisites from Phase 1
- ✅ Rate limiting middleware working
- ✅ N+1 queries fixed
- ✅ Connection pool tuned
- ✅ Performance baselines established
- ✅ Mobile Kanban functional

### External Dependencies
- ✅ Redis infrastructure available (Docker-based initially)
- ✅ PostgreSQL 15+ with FTS support
- ✅ DevOps support for Redis deployment
- ✅ Design/UX team for design system review

### Blocking Phase 3
- **None** — Phase 2 is prerequisite, but Phase 3 items are mostly independent

### Internal Phase 2 Dependencies

```
┌─────────────────┐
│ Design System   │ (Can start immediately)
│ Accessibility   │ (Depends on design system)
└────────┬────────┘
         │
    ┌────▼──────────────┐
    │ Connection Pool    │ (From Phase 1)
    │ N+1 Fixes         │ (From Phase 1)
    └────┬──────────────┘
         │
    ┌────▼──────────────┐      ┌──────────────────┐
    │ Cache Layer       │      │ RLS Policies     │
    │ (Dev 1)           │◄────►│ (Dev 2)          │
    └────┬──────────────┘      └──────────────────┘
         │                            │
         │ Coordinate cache           │ RLS testing
         │ invalidation with          │ with queries
         │ RLS policies              │
         │                            │
    ┌────▼────────────────────────────▼──┐
    │ Full-Text Search Implementation    │
    │ (Both devs collaborate)             │
    └────┬─────────────────────────────────┘
         │
    ┌────▼──────────────┐
    │ CHECK Constraints  │ (Quick wins at end)
    └────────────────────┘
```

---

## Stories Breakdown

### Story E2.1: Redis Caching Layer Design & Setup
**Effort:** 1 week | **Dev:** Backend | **Priority:** P1 | **Blocker:** No

- Define cache key naming strategy
- Set up Redis Docker service
- Implement cache client abstraction
- Configure cache TTL per entity type
- Set up Redis monitoring + alerting
- Document caching architecture

### Story E2.2: Query-Level Caching Implementation
**Effort:** 2 weeks | **Dev:** Backend | **Priority:** P1 | **Blocker:** E2.1

- Identify top 20 most-frequently-queried endpoints
- Implement caching for: projects, issues, sprints, comments
- Cache invalidation on entity updates
- Test cache hit rates (target: >80%)
- Implement cache bypass for admin/debugging
- Load test with concurrent users

### Story E2.3: Cache Invalidation & Consistency
**Effort:** 1 week | **Dev:** Backend | **Priority:** P1 | **Blocker:** E2.2

- Implement smart invalidation (don't invalidate everything on update)
- Test consistency scenarios (concurrent updates)
- Add cache monitoring dashboard
- Document invalidation patterns for developers
- Gradual rollout with feature flags

### Story E2.4: RLS Policies Implementation (Part 1)
**Effort:** 2 weeks | **Dev:** Backend | **Priority:** P1 | **Blocker:** No

- Design RLS policy model (users, projects, members, roles)
- Implement policies for projects table
- Implement policies for issues table
- Test with 3+ user roles (user, manager, admin)
- Database migration (enable RLS, apply policies)
- Comprehensive test suite

### Story E2.5: RLS Policies Implementation (Part 2)
**Effort:** 1-2 weeks | **Dev:** Backend | **Priority:** P1 | **Blocker:** E2.4

- Implement policies for comments, sprints, attachments
- Verify no policy bypass vulnerabilities
- Test role escalation scenarios
- Audit all queries for RLS compliance
- Load testing with RLS active
- Rollback procedures documented

### Story E2.6: Full-Text Search Implementation
**Effort:** 2-3 weeks | **Dev:** Backend | **Priority:** P1 | **Blocker:** E2.1, E2.4

- Create tsvector columns for searchable content
- Build GIN indexes for performance
- Implement ranking algorithm (title > description > comments)
- Test search accuracy on sample datasets
- Multi-field search (issues, comments, attachments)
- Performance testing: ensure <500ms response time

### Story E2.7: CHECK Constraints & Data Integrity
**Effort:** 1 week | **Dev:** Backend | **Priority:** P1 | **Blocker:** No

- Add CHECK constraints for status enum
- Add CHECK constraints for priority enum
- Add CHECK constraints for issue_type enum
- Migrate existing data (no invalid states)
- Comprehensive testing
- Documentation

### Story E2.8: Design System — Foundation & Components
**Effort:** 2-3 weeks | **Dev:** Frontend | **Priority:** P1 | **Blocker:** No

- Set up Storybook in frontend
- Document color system (12+ colors)
- Document typography (headings, body, code)
- Document spacing system (4px, 8px, 12px, 16px, 24px, 32px)
- Create base components (Button, Input, Modal, Card, Badge)
- Develop Figma→code sync strategy

### Story E2.9: Design System — Component Migration
**Effort:** 1-2 weeks | **Dev:** Frontend | **Priority:** P1 | **Blocker:** E2.8

- Migrate 80% of existing components to design system
- Update all pages to use design system components
- Remove duplicate component code
- Ensure visual consistency across app
- Update component documentation

### Story E2.10: Accessibility Audit & Compliance
**Effort:** 1-2 weeks | **Dev:** Frontend | **Priority:** P1 | **Blocker:** E2.8

- Run WAVE/Axe accessibility audits on all pages
- Fix all WCAG A/AA issues (color contrast, labels, focus)
- Test keyboard navigation on all interactive elements
- Test with screen readers (NVDA, JAWS if available)
- Implement skip-to-content links
- Document accessibility practices
- Create a11y testing checklist for future dev

---

## Effort Estimation

| Item | Week 1 | Week 2 | Week 3 | Week 4 | Week 5 | Week 6 | Week 7 | Week 8 |
|------|--------|--------|--------|--------|--------|--------|--------|--------|
| Cache Layer (BE1) | █████ | █████ | | | | | | |
| RLS Policies (BE2) | █████ | █████ | █████ | | | | | |
| FTS (BE1+BE2) | | | █████ | █████ | | | | |
| CHECK Constraints | | | | | █ | | | |
| Design System (FE) | █████ | █████ | █████ | | | | | |
| Accessibility (FE) | | | | | | █████ | █████ | |
| **Total Dev-Days** | 8 | 10 | 8 | 6 | 5 | 5 | 5 | 2 |

**Total Effort:** 2 BE + 1 FE for 8 weeks (parallel tracks)

---

## Risk Assessment

### High Risks

**Risk: RLS Policies Break Complex Queries**
- **Probability:** Medium
- **Impact:** High (data access failures)
- **Mitigation:** Full testing on production-like data before rollout
  - Test all query patterns
  - Feature flag for gradual rollout
  - Rollback procedure ready

**Risk: Cache Invalidation Race Conditions**
- **Probability:** Medium
- **Impact:** High (stale data served to users)
- **Mitigation:** Comprehensive concurrency testing
  - Simulate concurrent updates
  - Invalidation stress testing
  - Monitoring dashboard for cache health

**Risk: Search Relevance Issues**
- **Probability:** Low
- **Impact:** Medium (users can't find issues)
- **Mitigation:** Tuning phase with real user feedback
  - Configurable ranking weights
  - A/B testing of ranking algorithms

### Medium Risks

**Risk: Design System Adoption Slow**
- **Probability:** Low
- **Impact:** Medium (inconsistent UI during transition)
- **Mitigation:** Gradual component migration (don't convert all at once)
  - Migrate with each new feature
  - Maintain parallel old components temporarily

**Risk: Accessibility Testing Incomplete**
- **Probability:** Low
- **Impact:** Medium (some users excluded)
- **Mitigation:** Comprehensive audit + ongoing testing
  - Real assistive technology testing
  - Automated testing in CI/CD

---

## Success Metrics

### Performance Targets
- **Latency:** P95 200ms (from 350ms), 43% improvement ✅
- **Database CPU:** 20% (from 40%), 50% reduction ✅
- **Search:** <500ms responses (from 5-10s) ✅
- **Cache Hit Rate:** >80% ✅
- **Scalability:** 5K concurrent users ✅

### Scalability Targets
- **Concurrent Users:** 500 → 5K (10x improvement)
- **Throughput:** 200 req/s → 1000 req/s
- **Database Load:** Stable under sustained 5K users

### Security Targets
- **RLS Coverage:** 100% of tables
- **Vulnerabilities:** Zero policy bypass issues
- **Compliance:** SOC2/ISO27001 ready

### Quality Targets
- **Test Coverage:** 100% of new/modified code
- **CodeRabbit:** Zero CRITICAL/HIGH issues
- **Accessibility:** WCAG AA (100% of pages)

---

## Definition of Done

For this epic to be marked **COMPLETE**, all of the following must be true:

1. ✅ All 10 stories marked DONE (acceptance criteria met)
2. ✅ All tests passing (pytest + npm test)
3. ✅ Code review approved (linting + type checking)
4. ✅ Performance benchmarks verified
5. ✅ WCAG AA accessibility audit passed
6. ✅ RLS policies tested with real data and multiple roles
7. ✅ Cache invalidation tested under concurrent load
8. ✅ Deployed to staging, tested 2+ weeks
9. ✅ Zero regressions in functionality
10. ✅ Team trained on new systems (caching, RLS, FTS)
11. ✅ Documentation complete (architecture, ops runbooks, developer guides)
12. ✅ Ready for Phase 3 (WebSocket scaling, etc.)

---

## Phase 3 Prerequisites

For Phase 3 (Enterprise Features) to start, this epic must be **COMPLETE** and:

- [ ] Caching layer stable for 2+ weeks in production
- [ ] RLS policies proven in real-world scenarios
- [ ] Design system adopted by >80% of components
- [ ] Search relevance tuned based on user feedback
- [ ] 5K concurrent user load test successful
- [ ] Database CPU stable at 20% under load

---

## Timeline

```
Week 1:  Cache setup (BE) + Design system foundation (FE)
         RLS planning, database migration planning

Week 2:  Cache implementation (BE) + Design system migration (FE)
         RLS implementation start (BE)

Week 3:  Cache invalidation (BE) + Component migration (FE)
         RLS testing (BE)

Week 4:  FTS implementation (BE)
         Accessibility audit (FE)

Week 5:  FTS tuning (BE)
         Accessibility fixes (FE)

Week 6-7: Testing, hardening, documentation (All)

Week 8:  Final testing, deployment to production
```

---

## Files to Modify/Create

### Backend
- `backend/app/cache/` (new directory for caching logic)
- `backend/app/services/cache_manager.py` (new, cache abstraction)
- `backend/app/api/middleware/cache_middleware.py` (new)
- `backend/alembic/versions/` (RLS migration, CHECK constraints)
- `backend/app/db/models/` (RLS policy definitions)
- `backend/app/services/search.py` (FTS implementation)
- `docker-compose.yml` (Redis service)

### Frontend
- `frontend/src/components/` (component updates)
- `frontend/.storybook/` (new, Storybook setup)
- `frontend/src/styles/design-system.css` (new, design tokens)
- `frontend/src/styles/colors.css`, `typography.css`, `spacing.css` (new)
- `frontend/src/__tests__/accessibility.test.tsx` (new)

### Documentation
- `docs/architecture/caching-strategy.md` (new)
- `docs/architecture/rls-policies.md` (new)
- `docs/frontend/design-system.md` (new)
- `docs/guides/developer-accessibility.md` (new)

---

## Change Log

| Date | Status | Notes |
|------|--------|-------|
| 2026-02-21 | Created | Epic created from Brownfield Discovery Phase 10 |

---

**Epic Owner:** @sm (Story Manager)
**Engineering Lead (Backend):** TBD
**Engineering Lead (Frontend):** TBD
**QA Lead:** TBD
**Status:** Ready for Sprint Planning (after E1 completion)
