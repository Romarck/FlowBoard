# Workflow Execution Rules

This document defines how the AIOS framework executes workflows: the story development cycle (SDC), QA loop, spec pipeline, and brownfield discovery.

## Core Principle: Task-First

**Always start with a defined task.**

Before any agent begins work, there must be a clear, written task definition:
- What is being done?
- Why is it being done?
- What are the acceptance criteria?
- What is the expected output?

No vague requests. No "just explore the codebase." Every action has a task.

## Workflow 1: Story Development Cycle (SDC)

The standard flow for building features.

### Phase 1: CREATE (Story Manager @sm)

**Task**: Create story file from epic

**Inputs**:
- Epic from @pm with problem statement
- Scope and success metrics

**Actions**:
1. Create `docs/stories/{epic}.{id}.story.md`
2. Write title (clear, ≤60 chars)
3. Write description (100-200 words, problem-focused)
4. Write ≥2 acceptance criteria (Given/When/Then format)
5. Estimate complexity (1-5)
6. Identify risks
7. Mark status: `Draft`

**Outputs**:
- Story file in Draft status
- Ready for Phase 2 validation

**Duration**: 30 min - 2 hours

**Submission**: Story file committed or draft-ready

**Next Phase**: Phase 2 (when complete)

### Phase 2: VALIDATE (Product Owner @po)

**Task**: Validate story against 10-point checklist

**Inputs**:
- Story file from @sm in Draft status

**Actions**:
1. Review against 10-point checklist
2. Score each point (0-1 or just note)
3. Tally score (must be ≥7/10 for GO)
4. Document feedback

**Decision Gate**:
- **GO** (≥7/10) → Mark status: `Ready`, proceed to Phase 3
- **NO-GO** (<7/10) → Return to @sm with required fixes, status stays `Draft`

**Outputs**:
- Story status updated to Ready OR
- Feedback provided for @sm to revise

**Duration**: 30 min - 1 hour

**Submission**: Story file with validation feedback

**Next Phase**: Phase 3 (if GO) or back to Phase 1 (if NO-GO)

### Phase 3: IMPLEMENT (Developer @dev)

**Task**: Implement story exactly per acceptance criteria

**Inputs**:
- Story file marked Ready from @po

**Actions**:
1. Create feature branch: `git checkout -b feat/{story-id}`
2. Implement all acceptance criteria
3. Update File List in story as you modify files
4. Check off Dev Notes progress items
5. Write unit tests (≥80% coverage for new code)
6. Run `make test` && `make lint` (all passing)
7. Create atomic commits with story context
8. Mark status: `InProgress`

**Self-Healing (CodeRabbit)**:
- Auto-review after implementation
- CRITICAL issues: auto-fix (max 2 iterations)
- If CRITICAL persists → manual fix required
- HIGH/LOW issues: suggestions only

**Outputs**:
- Code implementing all AC
- Tests passing
- Linting clean
- Story file updated with File List and progress

**Duration**: Varies (1 day - 1 week typically)

**Submission**:
- All AC implemented ✅
- All tests passing ✅
- All linting clean ✅
- CodeRabbit review passed ✅
- Ready for Phase 4

**Next Phase**: Phase 4 (when complete)

### Phase 4: QA (QA Engineer @qa)

**Task**: Run 7-point quality checks

**Inputs**:
- Completed code from @dev
- Story marked InProgress

**Actions**:
1. Run 7-point quality checklist:
   - Code patterns (consistency, IDS principle)
   - Unit tests (≥80% coverage)
   - Acceptance criteria (all met)
   - Regression tests (all existing tests still pass)
   - Performance (no degradation)
   - Security (no vulnerabilities, no secrets)
   - Documentation (comments, docs updated)
2. Fill QA Results in story
3. Decide verdict: PASS / CONCERNS / FAIL / WAIVED

**If PASS or CONCERNS**:
- Mark status: `Done`
- Proceed to handoff
- Story complete ✅

**If FAIL**:
- Document issues
- Initiate QA Loop (see Workflow 2)

**Outputs**:
- QA Results filled in story file
- Status updated to Done OR QA Loop initiated

**Duration**: 1-2 hours (first pass)

**Submission**: Story marked Done (if PASS/CONCERNS)

**Next**: Handoff or QA Loop iteration

---

## Workflow 2: QA Loop

For stories that fail Phase 4 QA (FAIL verdict).

### QA Loop Flow

```
@qa reviews Phase 3 work
        ↓
FAIL verdict? List issues
        ↓
@dev fixes issues (Iteration 1)
        ↓
@qa re-reviews
        ↓
FAIL again? (Max 5 iterations)
  ├─ PASS/CONCERNS → Done ✅
  ├─ FAIL (Iter 1-4) → Loop continues
  └─ FAIL (Iter 5) → Escalate @architect
```

### Iteration Procedure

**Iteration N (1-5)**:

1. @qa provides FAIL feedback with specific issues
2. @dev fixes issues in Phase 3 implementation
3. Run tests locally: `make test && make lint`
4. Commit fixes with reference to iteration
5. @dev notifies @qa
6. @qa re-reviews Phase 4 checklist
7. New verdict: PASS/CONCERNS (done) or FAIL (continue)

**Example Feedback**:
```
QA Loop Iteration 1 FEEDBACK:

Issues Found:
1. Code Pattern: Hook naming inconsistent (useIssueData vs getIssue)
   → Fix: Rename to useGetIssue for consistency
2. Unit Tests: Only 65% coverage, need ≥80%
   → Fix: Add tests for edge cases in X
3. Security: Input validation missing on /api/issues POST
   → Fix: Add payload validation schema

After fixes, resubmit for re-review.
```

### Escalation (Iteration 5)

If after 5 iterations still FAIL:

```
⛔ QA Loop exceeded (5/5 iterations)
   Issues remain unsolved

🏗️ Escalate to @architect:
   - Review fundamental design
   - May require partial redesign
   - Document architectural decision
   - Return to Phase 3 for implementation fix

✅ After architectural review:
   - @dev re-implements with architect guidance
   - Reset QA Loop counter (new starting point)
   - Proceed with Phase 4 again
```

---

## Workflow 3: Spec Pipeline

For PRD/specification writing (when epic needs detailed spec).

### Spec Pipeline Flow

```
@pm creates epic
        ↓
Needs detailed spec? YES
        ↓
@pm writes specification
  - Problem statement
  - User stories
  - Acceptance criteria
  - Technical requirements
  - Constraints
        ↓
@architect reviews spec (design feasibility)
        ↓
Feasible?
  ├─ YES → Spec Ready, @sm can create stories
  └─ NO  → @pm revises with @architect input
```

### Spec Elements

**Problem Statement**:
- What problem does this solve?
- Who has the problem?
- Why is it important?

**User Stories** (for context):
- As a [role], I want [action], so that [benefit]

**Acceptance Criteria**:
- Technical requirements
- Success metrics
- Constraints

**Technical Requirements**:
- Database changes
- API changes
- Infrastructure changes

**Constraints**:
- Performance limits
- Security requirements
- Compatibility needs

---

## Workflow 4: Brownfield Discovery

For assessing and documenting existing code (technical debt, refactoring, etc.).

### Brownfield Discovery Process

```
Question posed: "What's the current state of X?"
        ↓
@architect leads discovery
        ↓
Phase 1: Scan
  - Read relevant code files
  - Map dependencies
  - Identify patterns
        ↓
Phase 2: Assess
  - Identify issues
  - Document findings
  - Rate severity/effort
        ↓
Phase 3: Plan
  - Recommend fixes
  - Break into stories for SDC
  - Document ADR (Architecture Decision Record)
        ↓
Output: Assessment document + story recommendations
```

### Brownfield Assessment Template

**File**: `docs/architecture/brownfield-{component}.md`

**Contents**:
1. **Current State**
   - Code structure
   - Dependencies
   - Test coverage
   - Known issues

2. **Issues Found**
   - Issue 1: Description, Impact, Effort
   - Issue 2: Description, Impact, Effort
   - ...

3. **Recommendations**
   - Fix option 1 (pros/cons)
   - Fix option 2 (pros/cons)
   - Recommended approach

4. **Resulting Stories**
   - Story for fix 1
   - Story for fix 2
   - ...

---

## Task-First Principle in Practice

### ❌ WRONG: Vague Request

```
"@dev, explore the codebase"
"@architect, review the code"
"@qa, check if it works"
```

**Problem**: No clear objective, no success criteria, agent guessing at intent.

### ✅ RIGHT: Clear Task Definition

```
@architect: Task - Assess current issue hierarchy implementation

Objective: Understand existing parent-child issue relationships

Scope:
- Backend: app/issues/models.py (Issue model)
- Backend: app/issues/service.py (IssueService.get_children)
- Frontend: src/hooks/useIssueHierarchy.ts

Acceptance Criteria:
1. Document current hierarchy structure
2. Identify 3 specific limitations
3. Recommend 2 refactoring approaches
4. Estimate effort for each approach

Output: docs/architecture/issue-hierarchy-assessment.md
```

---

## Workflow Summary Table

| Workflow | Agent | Phases | Duration | Output |
|----------|-------|--------|----------|--------|
| SDC | @sm→@po→@dev→@qa | 4 | 2-10 days | Story Done |
| QA Loop | @qa↔@dev | 1-5 iters | 1-8 hours | Story Done or Escalated |
| Spec Pipeline | @pm↔@architect | 2 | 1-3 days | Spec Ready |
| Brownfield | @architect | 3 | 4-8 hours | Assessment Doc |

---

## Handoff Between Workflows

### After SDC Complete

When story reaches Done status:

1. @dev creates git commit (if not already)
2. @devops pushes to remote
3. @devops creates PR
4. CI/CD runs
5. @devops merges to main
6. Session handoff created in `docs/sessions/`

### After QA Loop Complete

When story finally reaches Done:

1. Record final iteration count
2. Note any unresolved CONCERNS
3. Proceed to handoff

### After Brownfield Discovery

When assessment complete:

1. Store assessment in `docs/architecture/`
2. Break recommendations into stories
3. Create stories via SDC
4. Link back to assessment

---

## Error States & Recovery

### Story Rejected at Phase 2

**State**: @po returns story to @sm (NO-GO)

**Recovery**:
1. @sm revises story based on feedback
2. Resubmit to @po for re-validation
3. Continue from Phase 2

### Phase 3 Exceeds Estimate

**State**: @dev realizes story taking longer than estimated

**Recovery**:
1. Update Effort Estimate in story
2. Document reason (complexity, dependency, etc.)
3. Continue implementation
4. Flag for @pm/future planning

### QA Loop Exceeds 5 Iterations

**State**: Story still failing after 5 QA iterations

**Recovery**:
1. @qa escalates to @architect
2. @architect reviews design
3. May require redesign (back to Phase 3)
4. Or architectural guidance for @dev
5. Continue from Phase 3 or Phase 4

---

## Atomic Commits & Continuity

**Rule**: Commit before starting next task

**Pattern**:
```bash
# Finish task 1
make test && make lint
git add .
git commit -m "feat/fix: task 1 description"

# Start task 2
# Now if interrupted, task 1 is safe
```

**Benefits**:
- Easy to rollback if task 2 fails
- Clear history of work
- Easy for team to understand changes
- Safe for session interruptions

---

## Session Handoff

Every session must end with a handoff document.

**Location**: `docs/sessions/{YYYY-MM}/session-{DATE}.md`

**Template**:
```markdown
# Session Handoff — {DATE}

## Completed
- [x] Story E1.1: Description
- [x] Story E1.2: Description

## In Progress (Paused)
- [ ] Story E1.3: Description
  Status: Phase 3 (Implement) - 60% complete
  Blocker: None
  Next: Finish tests and validation

## Next Steps (for next session)
1. Complete Story E1.3 tests
2. Submit E1.3 for QA review
3. Start Story E2.1

## Important Context
- Database: Seeded with test data
- Env: .env configured with API keys
- Git: On feat/e1 branch, 3 commits ready
- Tests: 94 passing, 2 pending (intentional)
- Performance: No regressions detected

## Files Modified
- backend/app/issues/service.py
- frontend/src/hooks/useIssue.ts
- docs/stories/E1.3.story.md

## Test Status
- Backend: 94/96 passing ✅
- Frontend: 42/44 passing ✅

## Known Issues
- Styling: Modal needs spacing adjustment (low priority)
- Performance: Drag/drop with 1000+ items slow (addressed in E2)

## Session Agent
Worked with: @dev, @architect

## Metrics
- Stories completed: 2
- Time investment: 8 hours
- Code churn: 340 lines added, 120 lines removed
```

---

## Monitoring & Metrics

Track workflow metrics for continuous improvement:

- **SDC Duration**: Average Phase 1-4 duration
- **QA Loop Iterations**: Average iterations to Done
- **First-Pass Quality**: % stories passing Phase 4 on first try
- **Blocking Issues**: Common blockers and root causes
- **Team Velocity**: Stories completed per sprint

Review metrics monthly with team.

