# Story Lifecycle Rules

This document defines the 4-phase Story Development Cycle (SDC) and story status transitions.

## Story Development Cycle (4 Phases)

```
Phase 1: Create (@sm)    → Phase 2: Validate (@po)    → Phase 3: Implement (@dev)    → Phase 4: QA (@qa)
Draft                    → Ready                       → InProgress                   → InReview → Done
```

### Phase 1: Create (@sm) — Draft Status

**Agent**: Story Manager (River)

**Task**: Create story file from epic with proper structure

**Requirements**:
- [ ] Story file at `docs/stories/{epic}.{id}.story.md`
- [ ] Story title derived from epic/PRD
- [ ] Detailed description of problem/need
- [ ] Acceptance criteria (Given/When/Then format, ≥2 criteria)
- [ ] File List section (empty initially)
- [ ] Complexity assessment (1-5)
- [ ] Risk assessment
- [ ] Effort estimate

**Acceptance Criteria Example**:
```
- [ ] Given X is in state A, when user performs Y, then Z should happen
- [ ] Given user has role R, when accessing endpoint E, then proper permission check occurs
- [ ] Given A and B, when C happens, then D result is returned
```

**Output**: Story file in Draft status

**Next**: → Phase 2 (when @sm completes)

---

### Phase 2: Validate (@po) — Ready Status

**Agent**: Product Owner (Pax)

**Task**: Validate story against 10-point checklist

**10-Point Validation Checklist**:
1. **Title**: Clear, actionable, ≤60 characters
2. **Description**: Problem clearly explained, 100-200 words
3. **Acceptance Criteria**: ≥2 criteria in Given/When/Then format
4. **Scope**: Clearly bounded, no scope creep visible
5. **Complexity**: Realistic estimate (1-5 scale with justification)
6. **Dependencies**: All blocking tasks identified
7. **Testing Strategy**: How will criteria be verified
8. **Database Changes**: If any, clearly documented
9. **API Changes**: If any, clearly documented
10. **Risks**: Identified and mitigation plan present

**Decision Gate**:
- **GO** (≥7/10): Story ready for development → Mark as "Ready"
- **NO-GO** (<7/10): Return to @sm with required fixes → Stay in "Draft"

**Feedback Format** (if NO-GO):
```
Validation Result: NO-GO (6/10)

Issues:
- Point 2: Description too vague, needs specific problem statement
- Point 5: Complexity marked as 2, appears to be 4 based on AC

Required Fixes:
- Expand description with specific examples
- Update complexity to 4
- Add acceptance criterion for edge case X

@sm please revise and resubmit.
```

**Output**: Story file status updated to "Ready"

**Next**: → Phase 3 (when @dev claims)

---

### Phase 3: Implement (@dev) — InProgress Status

**Agent**: Developer (Dex)

**Task**: Implement story exactly per acceptance criteria

**Requirements**:
- [ ] Implement all acceptance criteria
- [ ] Update File List in story file as changes occur
- [ ] Mark Dev Notes checkboxes `[x]` as work completes
- [ ] Run `make test` && `make lint` before submission
- [ ] Ensure all tests pass
- [ ] Ensure no linting errors
- [ ] Self-healing: CodeRabbit auto-review (max 2 iterations for CRITICAL)
- [ ] Commit with atomic commits before moving to next task

**File List Update Format**:
```markdown
## File List
- `src/components/MyComponent.tsx` (NEW)
- `src/hooks/useMyQuery.ts` (MODIFIED)
- `backend/app/my_module/` (NEW)
- `backend/app/routes.py` (MODIFIED)
- `tests/test_feature.py` (NEW)
```

**Dev Notes Progress**:
```markdown
## Dev Notes (updated by @dev)
- [x] Create API endpoint
- [x] Implement database schema changes
- [ ] Add frontend components
- [ ] Write tests
- [ ] Update documentation
```

**CodeRabbit Integration**:
- CRITICAL issues → auto-fix (max 2 iterations)
- If CRITICAL persists after 2 iterations → HALT, manual fix required
- Other issues → suggestion for @dev review

**Output**: All acceptance criteria implemented, tests passing, linting clean

**Submission**: Commit prepared, ready for Phase 4

**Next**: → Phase 4 (when @dev submits for QA)

---

### Phase 4: QA Gate (@qa) — InReview → Done Status

**Agent**: QA Engineer

**Task**: Run 7-point quality checks

**7-Point QA Checklist**:
1. **Code Patterns**: Consistency with existing patterns (IDS principle)
2. **Unit Tests**: ≥80% coverage for new code
3. **Acceptance Criteria**: All AC met with verification steps
4. **Regression Testing**: No existing tests broken
5. **Performance**: No degradation vs. baseline (or documented improvements)
6. **Security**: No OWASP top 10 vulnerabilities, secrets not committed
7. **Documentation**: Code comments, updated docs/README, API docs

**Verdict Options**:
- **PASS** → Story moves to Done
- **CONCERNS** → Story moves to Done (with noted concerns for future)
- **FAIL** → Enters QA Loop (iterations with @dev)
- **WAIVED** → Story moves to Done (documented exception)

**QA Loop** (if FAIL):
- @qa submits FAIL with specific issues
- @dev fixes issues (max 5 iterations per story)
- @dev resubmits for @qa re-review
- If 5 iterations exceeded → escalate to @architect

**QA Report Format**:
```markdown
## QA Results

Verdict: PASS / CONCERNS / FAIL / WAIVED

### 1. Code Patterns: ✅ PASS
- Follows dnd-kit patterns for drag/drop
- API client structure matches existing patterns
- Component hooks follow useXQuery naming convention

### 2. Unit Tests: ⚠️ CONCERNS
- Coverage 75%, target 80%
- Missing edge case for X scenario
- Recommendation: Add test for null handling

### 3. Acceptance Criteria: ✅ PASS
- All 3 AC implemented and verified

### 4. Regression Testing: ✅ PASS
- All 106 existing tests still passing

### 5. Performance: ✅ PASS
- No API performance degradation
- Drag/drop performance maintained

### 6. Security: ✅ PASS
- No secrets in commit
- Input validation on all API endpoints
- XSS protection maintained

### 7. Documentation: ⚠️ CONCERNS
- Code comments adequate
- API docs updated
- Frontend component documentation missing (low priority)

Overall: PASS ✅
```

**Output**: Story status updated to "Done"

**Next**: → Session handoff (when all stories in batch complete)

---

## Story File Template

```markdown
# Story {Epic}.{ID} — {Title}

## Status
Draft / Ready / InProgress / InReview / Done

## Description
{Problem/need explained in 100-200 words}

## Acceptance Criteria
- [ ] Given X, when Y, then Z
- [ ] Given A, when B, then C
- [ ] Given D, when E, then F

## Scope
{What is included, what is explicitly NOT included}

## Complexity
{1-5 with justification}

## Risks
- Risk 1: {Description and mitigation}
- Risk 2: {Description and mitigation}

## Effort Estimate
{Time estimate and breakdown}

## Dependencies
{List any blocking tasks or prerequisites}

## File List
- `src/path/File.tsx` (NEW)
- `backend/path/file.py` (MODIFIED)

## Dev Notes (updated by @dev)
- [ ] Task 1
- [ ] Task 2

## QA Results (filled by @qa)
Verdict: PASS / CONCERNS / FAIL / WAIVED
{QA checklist results}
```

---

## Authority Rules

### Story Edits by Phase

| Content | Draft | Ready | InProgress | InReview | Done |
|---------|-------|-------|-----------|----------|------|
| Title | @sm | ~~@po~~ | ✗ | ✗ | ✗ |
| Description | @sm | ~~@po~~ | ✗ | ✗ | ✗ |
| Acceptance Criteria | @sm | ~~@po~~ | ✗ | ✗ | ✗ |
| File List | ✗ | ✗ | @dev | @dev | ✗ |
| Dev Notes | ✗ | ✗ | @dev | @dev | ✗ |
| QA Results | ✗ | ✗ | ✗ | @qa | ✗ |

*Note: ~~strikethrough~~ means "should not edit after validation"*

### What @po CANNOT Edit After Validation
- Story title (already validated)
- Description (already validated)
- Acceptance criteria (already validated)
- Status (only @dev and @qa change status during implementation)

### What ONLY @dev Can Do
- Mark checkboxes in Dev Notes
- Update File List
- Make git commits with story progress
- Implement features per acceptance criteria

### What ONLY @qa Can Do
- Run QA checks
- Fill QA Results section
- Update verdict (PASS/CONCERNS/FAIL/WAIVED)

---

## Time Guidelines

| Phase | Agent | Typical Duration |
|-------|-------|------------------|
| Phase 1 | @sm | 30 min - 2 hours |
| Phase 2 | @po | 30 min - 1 hour |
| Phase 3 | @dev | Varies (1 day - 1 week) |
| Phase 4 | @qa | 1-2 hours (first pass) |

---

## On Story Status Fields

The `Status` field in story files is the source of truth. Allowed values:
- **Draft**: Phase 1, @sm creating, acceptance criteria being finalized
- **Ready**: Phase 2, @po validated, can be assigned to @dev
- **InProgress**: Phase 3, @dev actively implementing
- **InReview**: Phase 4, @qa reviewing, feedback loop if needed
- **Done**: All phases complete, PASS or CONCERNS verdict from @qa

---

## FAQ

**Q: Can @po edit acceptance criteria after validating?**
A: No. After @po marks "Ready", the AC are locked. If AC need changes, @po should have caught this in Phase 2.

**Q: Can @dev request AC clarification?**
A: Yes. If AC are ambiguous during implementation, @dev can ask for clarification but should NOT change the written AC. Instead, document the clarification in Dev Notes and proceed.

**Q: What if a story is taking much longer than estimated?**
A: @dev should update the Effort Estimate in Dev Notes and @po should be aware. If scope grew, that's a new story. If estimate was wrong, that's learning for next time.

**Q: Can we skip Phase 2 validation?**
A: No. All stories must go through @po validation (Phase 2). This ensures quality and catches issues early.

**Q: What happens if Phase 4 QA fails multiple times?**
A: After 5 iterations in the QA Loop, escalate to @architect for design review. The story may need redesign.
