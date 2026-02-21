# Epic E3: Phase 3 — Enterprise Features

**Status:** Ready
**Priority:** P2 (Medium)
**Epic ID:** E3
**Timeline:** Weeks 13-20 (2 months)
**Team Size:** 2-3 developers (1-2 backend, 1 frontend)
**Expected Impact:** Horizontal scaling support, 50K+ user capacity, enterprise features
**Prerequisite:** Epics E1 + E2 must be COMPLETE

---

## Summary

Enterprise-scale features and polish enabling growth from SMB to enterprise customers. These features add user experience enhancements and operational capabilities required for larger teams and compliance requirements.

**Business Value:**
- Support 50K+ concurrent users across multiple instances
- Enterprise features (audit logging, dark mode, keyboard shortcuts)
- Distributed real-time updates (WebSocket scaling)
- Compliance-ready (audit trail, data governance)
- Increased user productivity (shortcuts, preferences)

---

## Description

### What is this Epic about?

This epic addresses 5 strategic debts that unlock enterprise capabilities:

1. **WebSocket Scalability** (4-5 weeks) - Distributed real-time updates across instances
2. **Dark Mode** (1-2 weeks) - User preference, accessibility feature
3. **Keyboard Shortcuts** (1-2 weeks) - Power users, productivity
4. **Comprehensive Audit Logging** (2-3 weeks) - Compliance, forensics
5. **Distributed Tracing** (2-3 weeks) - Observability, debugging at scale

### Why now?

- Phase 2 established scalability foundation (caching, RLS, FTS)
- WebSocket currently single-instance only (blocks horizontal scaling)
- Enterprise customers demanding audit trails for compliance
- Dark mode requested by 85% of users (user feedback)
- Keyboard shortcuts improve power user workflows
- Distributed tracing needed for multi-instance debugging

### Team Coordination

**Backend Team (1-2 devs):**
- **Dev 1:** WebSocket refactor (primary), distributed tracing (secondary)
- **Dev 2:** Audit logging (if available)

**Frontend Team (1 dev):**
- Dark mode implementation
- Keyboard shortcuts
- Audit log viewer UI

---

## Acceptance Criteria

### Must Have (Definition of Done)

**Backend - WebSocket Scalability:**
- [ ] WebSocket layer abstracted from transport (socket.io or similar)
- [ ] Redis Pub/Sub for cross-instance messaging
- [ ] Horizontal scaling: 1 instance → N instances
- [ ] Load testing: 5K users across 2 instances
- [ ] Zero message loss during instance failover
- [ ] Backward compatibility with existing clients
- [ ] Gradual rollout with feature flags

**Backend - Audit Logging:**
- [ ] All data modifications logged (create, update, delete)
- [ ] Audit log immutable (append-only)
- [ ] User attribution (who made the change)
- [ ] Timestamp and change details recorded
- [ ] Searchable audit log (by entity, user, date)
- [ ] 90-day retention (configurable)
- [ ] Export to compliance formats (CSV, JSON)

**Backend - Distributed Tracing:**
- [ ] Traces span multiple service calls
- [ ] Request ID propagation across services
- [ ] Latency breakdown visible (database, cache, API)
- [ ] Integration with monitoring dashboard
- [ ] Performance impact < 5% overhead

**Frontend - Dark Mode:**
- [ ] Light/dark theme toggle in settings
- [ ] Preference persisted (localStorage)
- [ ] 100% of components support both themes
- [ ] Contrast ratios maintained in both themes
- [ ] Smooth transition between themes
- [ ] System preference detection (prefers-color-scheme)

**Frontend - Keyboard Shortcuts:**
- [ ] Common shortcuts (j/k navigation, c create, s search, etc.)
- [ ] Help modal listing all shortcuts
- [ ] Vim-style optional keybindings
- [ ] Conflict detection (custom shortcuts vs. built-in)
- [ ] Customizable shortcuts in settings
- [ ] Focus management (shortcuts work only in app, not in inputs)

### Success Metrics

- **Scalability:** N instances × 5K users each = 5K+ users per instance equivalent
- **Audit Log:** 100% of modifications captured, zero losses
- **Tracing:** >95% of requests traced, latency visible
- **Dark Mode:** 85% of users enabled after launch (target)
- **Keyboard Shortcuts:** 60% of power users using after launch
- **Performance:** No regression from Phase 2 (still <200ms P95 latency)

### Quality Gates

- [ ] All tests passing (100% of modified code)
- [ ] Zero CodeRabbit CRITICAL issues
- [ ] Load testing: N instances stable
- [ ] WebSocket failover tested
- [ ] Dark mode contrast ratios verified (WCAG AA)
- [ ] Keyboard shortcuts tested with external devices
- [ ] Audit log integrity verified

---

## Scope

### IN (Included)

✅ WebSocket layer abstraction + Redis Pub/Sub integration
✅ Horizontal scaling support (N backend instances)
✅ Comprehensive audit logging (all modifications)
✅ Audit log UI (viewer, search, export)
✅ Distributed tracing infrastructure
✅ Dark mode implementation (100% coverage)
✅ Keyboard shortcuts system + common shortcuts
✅ Load testing at enterprise scale

### OUT (Not Included)

❌ Advanced analytics (Phase 4+)
❌ Soft deletes (Phase 4+)
❌ Custom fields/workflows (Phase 4+)
❌ SSO/SAML integration (separate epic)
❌ API rate limiting increase (already in Phase 1)
❌ Backup/disaster recovery (infrastructure epic)

---

## Dependencies

### Prerequisites from Phase 2
- ✅ Caching layer stable
- ✅ RLS policies proven
- ✅ FTS search working
- ✅ Design system adopted
- ✅ WCAG AA compliance verified
- ✅ 5K concurrent user load test passed

### External Dependencies
- ✅ Redis available (from Phase 2)
- ✅ Monitoring/observability dashboard
- ✅ DevOps support for tracing infrastructure
- ✅ Compliance team for audit log requirements

### No Blocking Dependencies
- This epic is mostly independent from other future work
- Can be parallelized with Phase 4 items if needed

---

## Stories Breakdown

### Story E3.1: WebSocket Architecture Refactor
**Effort:** 2 weeks | **Dev:** Backend | **Priority:** P2 | **Blocker:** No

- Abstract WebSocket transport layer
- Design message queuing strategy
- Plan Redis Pub/Sub integration
- Create distributed message broker abstraction
- Document WebSocket architecture
- Test basic message flow across instances

### Story E3.2: Redis Pub/Sub Integration
**Effort:** 1-2 weeks | **Dev:** Backend | **Priority:** P2 | **Blocker:** E3.1

- Implement Redis Pub/Sub for real-time updates
- Route notifications through Redis (issues updated, comments, etc.)
- Test message delivery across instances
- Load test: multiple instances receiving updates
- Failover testing (instance goes down)

### Story E3.3: WebSocket Horizontal Scaling & Testing
**Effort:** 1-2 weeks | **Dev:** Backend | **Priority:** P2 | **Blocker:** E3.2

- Load test: 5K users across 2+ instances
- Verify message ordering and consistency
- Graceful shutdown/startup procedures
- Monitoring for WebSocket health
- Gradual rollout strategy with feature flags

### Story E3.4: Audit Logging Infrastructure
**Effort:** 2 weeks | **Dev:** Backend | **Priority:** P2 | **Blocker:** No

- Design audit log schema (entity, action, changes, user, timestamp)
- Create audit log table (append-only)
- Implement logging middleware for all mutations
- User attribution (auth context capture)
- Searchable queries (by entity, user, date range)
- Data retention policies (90-day default)

### Story E3.5: Audit Log Viewer UI
**Effort:** 1-2 weeks | **Dev:** Frontend | **Priority:** P2 | **Blocker:** E3.4

- Audit log page/modal
- Search and filter (by entity, user, date)
- Display change details (before/after values)
- Export functionality (CSV, JSON)
- Pagination for large logs
- Real-time audit log updates (if user watching)

### Story E3.6: Distributed Tracing Setup
**Effort:** 1-2 weeks | **Dev:** Backend | **Priority:** P2 | **Blocker:** No

- Choose tracing solution (OpenTelemetry recommended)
- Request ID propagation (all services)
- Span creation for key operations (DB queries, API calls, cache hits)
- Integration with monitoring dashboard
- Performance testing (<5% overhead target)

### Story E3.7: Tracing Dashboards & Debugging
**Effort:** 1 week | **Dev:** Backend | **Priority:** P2 | **Blocker:** E3.6

- Create latency breakdown dashboard (where is slowness?)
- Per-request tracing (drill-down from slow request to spans)
- Service dependency visualization
- Alerting on latency spikes
- Documentation for debugging slow requests

### Story E3.8: Dark Mode Implementation
**Effort:** 2 weeks | **Dev:** Frontend | **Priority:** P2 | **Blocker:** No

- Define dark color palette (background, text, accents)
- Implement theme toggle in settings
- Persist preference (localStorage)
- Detect system preference (prefers-color-scheme)
- Update all components for dark mode support
- Verify contrast ratios (WCAG AA)
- Smooth transitions between themes

### Story E3.9: Keyboard Shortcuts System
**Effort:** 1-2 weeks | **Dev:** Frontend | **Priority:** P2 | **Blocker:** E3.8

- Implement keyboard event handler system
- Define common shortcuts:
  - `j` / `k` — Navigate between issues
  - `c` — Create issue
  - `s` — Focus search
  - `enter` — Open selected issue
  - `/` — Focus command palette
  - `?` — Show help
- Shortcuts help modal
- Vim-style keybindings (optional, configurable)
- Focus management (no shortcuts in input fields)

### Story E3.10: Keyboard Shortcuts Customization
**Effort:** 1 week | **Dev:** Frontend | **Priority:** P2 | **Blocker:** E3.9

- Settings page for custom keyboard shortcuts
- Conflict detection (warn if shortcut overrides browser)
- Import/export shortcuts configuration
- Reset to defaults option
- Test with external keyboards (if time permits)

---

## Effort Estimation

| Component | Effort | Duration | Risk | Notes |
|-----------|--------|----------|------|-------|
| WebSocket Refactor | 10 days | 2w | Medium | Complex refactoring |
| Redis Pub/Sub | 7 days | 1.5w | Medium | Need careful testing |
| WebSocket Testing | 7 days | 1.5w | Medium | Load testing required |
| Audit Logging | 10 days | 2w | Low | Straightforward |
| Audit Log UI | 7 days | 1.5w | Low | Standard CRUD |
| Distributed Tracing | 7 days | 1.5w | Low | Setup mostly standard |
| Tracing Dashboard | 5 days | 1w | Low | Monitoring integration |
| Dark Mode | 10 days | 2w | Low | Component work |
| Keyboard Shortcuts | 7 days | 1.5w | Low | Event handling |
| Shortcuts Config | 5 days | 1w | Low | Settings page |
| **TOTAL** | **75 days** | **2 months** | **Low-Medium** | 1-2 BE, 1 FE |

---

## Risk Assessment

### Medium Risks

**Risk: WebSocket Refactor Breaks Real-Time Updates**
- **Probability:** Medium
- **Impact:** High (users miss notifications)
- **Mitigation:** Comprehensive testing plan
  - Test all notification flows
  - Gradual rollout with feature flags
  - Parallel old/new system briefly
  - Monitor error rates closely

**Risk: Audit Log Performance Degrades**
- **Probability:** Low
- **Impact:** Medium (database slow)
- **Mitigation:** Separate audit log table, careful indexing
  - Don't query audit logs during normal operations
  - Async logging if needed

### Low Risks

**Risk: Dark Mode Contrast Issues**
- **Probability:** Low
- **Impact:** Low (some elements hard to read)
- **Mitigation:** WCAG AA testing during development
  - Automated contrast checking
  - Manual testing of all colors

**Risk: Keyboard Shortcuts Conflict with Browser**
- **Probability:** Low
- **Impact:** Medium (confusing for users)
- **Mitigation:** Careful shortcut selection
  - Avoid common browser shortcuts (Ctrl+S, Ctrl+W, etc.)
  - Help users understand potential conflicts
  - Easy disable option

---

## Success Metrics

### Scalability Targets
- **Instances:** 1 → N (infinite horizontal scaling)
- **Users per Instance:** 5K (same as Phase 2)
- **Total Capacity:** N × 5K users
- **Message Loss:** 0 (zero tolerance)

### Performance Targets
- **Latency:** Maintained <200ms P95 (no regression)
- **WebSocket Latency:** <100ms message delivery
- **Audit Log Query:** <500ms (even with large dataset)
- **Tracing Overhead:** <5%

### Feature Adoption
- **Dark Mode:** 85% of users use within 1 month
- **Keyboard Shortcuts:** 60% of power users use within 1 month
- **Audit Logging:** 100% coverage (all modifications logged)

### Quality Targets
- **Test Coverage:** 100% of new/modified code
- **CodeRabbit:** Zero CRITICAL issues
- **Uptime:** 99.95% (enterprise SLA)

---

## Definition of Done

For this epic to be marked **COMPLETE**, all of the following must be true:

1. ✅ All 10 stories marked DONE (acceptance criteria met)
2. ✅ All tests passing (pytest + npm test)
3. ✅ Code review approved (linting + type checking)
4. ✅ WebSocket horizontal scaling verified with load testing
5. ✅ Audit log 100% coverage, searchable and exportable
6. ✅ Dark mode 100% component coverage, WCAG AA verified
7. ✅ Keyboard shortcuts tested on multiple devices
8. ✅ Distributed tracing integrated, <5% overhead verified
9. ✅ Deployed to staging, tested 2+ weeks
10. ✅ Zero regressions from Phase 2
11. ✅ Team trained on new systems
12. ✅ Documentation complete (architecture, ops runbooks)
13. ✅ Ready for Phase 4 (advanced features)

---

## Phase 4 Readiness

For Phase 4+ work to begin, this epic must be **COMPLETE** and:

- [ ] WebSocket scaling proven stable for 2+ weeks
- [ ] Audit logging working reliably
- [ ] Dark mode adopted by user base
- [ ] Distributed tracing providing value to ops team
- [ ] No critical issues from enterprise feature rollout

---

## Timeline

```
Week 1:   WebSocket architecture (BE) + Dark mode base (FE)
          Audit logging design (BE)

Week 2:   Redis Pub/Sub integration (BE)
          Dark mode component updates (FE)
          Audit log UI (FE)

Week 3:   WebSocket testing (BE)
          Keyboard shortcuts (FE)
          Distributed tracing (BE)

Week 4:   Fine-tuning, documentation, testing

Week 5:   Testing, hardening

Week 6:   Final testing, staging deployment

Week 7:   Monitoring, early production rollout

Week 8:   Production stabilization, monitoring
```

---

## Files to Modify/Create

### Backend
- `backend/app/realtime/` (new, WebSocket abstraction)
- `backend/app/realtime/websocket_manager.py` (new)
- `backend/app/realtime/pub_sub.py` (new, Redis Pub/Sub)
- `backend/app/audit/` (new, audit logging)
- `backend/app/audit/logger.py` (new)
- `backend/app/tracing/` (new, distributed tracing)
- `backend/app/tracing/setup.py` (new)
- `backend/alembic/versions/` (audit log table migration)

### Frontend
- `frontend/src/hooks/useKeyboardShortcuts.ts` (new)
- `frontend/src/contexts/ThemeContext.tsx` (new or update)
- `frontend/src/styles/dark-theme.css` (new)
- `frontend/src/pages/AuditLogPage.tsx` (new)
- `frontend/src/pages/SettingsPage.tsx` (keyboard shortcuts settings)

### Configuration
- `docker-compose.yml` (ensure Redis available from Phase 2)
- `.env` (tracing configuration)
- Backend configuration for audit retention

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
**Status:** Ready for Sprint Planning (after E1 + E2 completion)
