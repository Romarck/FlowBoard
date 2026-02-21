# AIOS Commands Reference

This file provides quick access to AIOS agent commands and activation patterns.

## Quick Activation

Use `@{agent}` to activate an agent:

```
@dev    - Activate Developer (Dex) for implementation work
@qa     - Activate QA Engineer for quality checks
@sm     - Activate Story Manager (River) for story creation
@po     - Activate Product Owner (Pax) for story validation
@pm     - Activate Product Manager (Morgan) for epic creation
@architect - Activate Architect for design decisions
@devops - Activate DevOps (Gage) for git/CI operations
@aios-master - Activate framework governance
```

## Command Syntax

### Global Commands (Use `*` prefix)

```bash
*help                    # Show available commands
*status                  # Show current phase/story status
*rules                   # Show AIOS framework rules
*task {name}            # Execute specific task

# Phase-specific
*develop {story-id}     # Start Phase 3 implementation (@dev)
*qa-gate {story-id}     # Run Phase 4 QA checks (@qa)
*qa-loop {story-id}     # Start QA Loop with @dev
*create-story {epic}    # Create story from epic (@sm)
*validate {story-id}    # Validate story readiness (@po)

# Infrastructure (DevOps only)
*push                   # Push to remote git (@devops only)
*create-pr              # Create pull request (@devops only)
*deploy                 # Deploy to production (@devops only)
```

## Agent Commands by Phase

### Phase 1: CREATE (@sm)

Story Manager creates stories from epics.

```
*create-story E1.1
```

**Story file created**: `docs/stories/E1.1.story.md`

**Status**: Draft

### Phase 2: VALIDATE (@po)

Product Owner validates against 10-point checklist.

```
*validate E1.1
```

**Validation checks**:
1. Title clarity
2. Description quality
3. Acceptance criteria (≥2, Given/When/Then format)
4. Scope definition
5. Complexity assessment
6. Dependency identification
7. Testing strategy
8. Database changes documented
9. API changes documented
10. Risks identified

**Verdict**: GO (≥7/10) → Status: Ready | NO-GO → Status: Draft (return to @sm)

### Phase 3: IMPLEMENT (@dev)

Developer implements story per acceptance criteria.

```
*develop E1.1
```

**During Phase 3**:
- Update File List as you modify files
- Check off Dev Notes items `[x]`
- Run `make test` && `make lint`
- Make atomic commits with `git commit`
- Request clarifications in Dev Notes if AC ambiguous

**NOT allowed**:
- `git push` (wait for @devops)
- Edit story title/AC/scope
- Change story status

**Status**: InProgress

### Phase 4: QA (@qa)

QA Engineer runs 7-point quality checks.

```
*qa-gate E1.1
```

**7-Point QA Checklist**:
1. Code Patterns — Consistency with codebase
2. Unit Tests — ≥80% coverage for new code
3. Acceptance Criteria — All AC met and verified
4. Regression Testing — All existing tests still pass
5. Performance — No degradation vs. baseline
6. Security — No vulnerabilities, no secrets committed
7. Documentation — Code comments, docs updated

**Verdict Options**:
- **PASS** → Story moves to Done ✅
- **CONCERNS** → Story moves to Done with noted concerns ⚠️
- **FAIL** → Story enters QA Loop for fixes 🔄
- **WAIVED** → Story moves to Done (documented exception)

**If FAIL**:
- @qa lists specific issues
- @dev fixes (max 5 iterations per story)
- @dev resubmits for @qa re-review
- Escalate to @architect after 5 iterations

**Status**: InReview → Done

---

## Developer Workflow

Typical @dev workflow for implementing Phase 3:

```bash
# 1. Start story
*develop E1.1

# 2. Create feature branch
git checkout -b feat/e1-1-issue-creation

# 3. Implement features
# - Edit src/components/...
# - Edit backend/app/...
# - Update File List in story

# 4. Test locally
make test
make lint

# 5. Commit progress
git add .
git commit -m "feat: implement E1.1 issue creation

- Add create issue endpoint
- Add frontend form component
- Update issue schema

Story: E1.1"

# 6. Mark progress in story Dev Notes
# - Check off [x] Task 1
# - Check off [x] Task 2

# 7. Submit for QA
# (Once all AC met, tests passing, linting clean)
```

## QA Workflow

Typical @qa workflow for Phase 4:

```bash
# 1. Get ready for QA
*qa-gate E1.1

# 2. Run all 7 quality checks
# - Review code patterns
# - Check test coverage (target ≥80%)
# - Verify AC met
# - Run full test suite
# - Performance benchmark
# - Security scan
# - Documentation review

# 3. Fill QA Results section
# Edit `docs/stories/E1.1.story.md` → QA Results

# 4. Verdict decision
#    PASS / CONCERNS / FAIL / WAIVED

# 5. If FAIL, start QA Loop
*qa-loop E1.1
# → Notifies @dev for fixes
```

## Story Creation Workflow

Typical @sm workflow for Phase 1:

```bash
# 1. Get epic requirement
# Epic: E1 "Sprint Planning"
# @pm provides: Problem statement, success criteria, scope

# 2. Create story
*create-story E1.1

# 3. Story file structure
# docs/stories/E1.1-issue-hierarchy.md
# - Title
# - Description
# - Acceptance Criteria (≥2 items)
# - Complexity (1-5)
# - Risks
# - Effort Estimate

# 4. Submit for validation
# → Story status: Draft
# → Ready for @po review
```

## Story Validation Workflow

Typical @po workflow for Phase 2:

```bash
# 1. Review story against checklist
*validate E1.1

# 2. Check 10 points
# [ ] Title - Clear, actionable, ≤60 chars
# [ ] Description - Problem explained, 100-200 words
# [ ] AC - ≥2 in Given/When/Then format
# [ ] Scope - Clearly bounded, no scope creep
# [ ] Complexity - Realistic (1-5)
# [ ] Dependencies - All identified
# [ ] Testing Strategy - Clear
# [ ] DB Changes - Documented
# [ ] API Changes - Documented
# [ ] Risks - Identified with mitigation

# 3. Score (≥7/10 = GO)
GO (8/10) - Story ready for development
↓
Story status: Ready
@dev can now claim and start Phase 3

# OR

NO-GO (6/10) - Story needs fixes
↓
Story status: Draft (back to @sm)
List specific fixes needed
```

---

## DevOps Commands (Exclusive)

ONLY @devops can run these:

```bash
*push                   # Push branch to remote
*create-pr              # Create pull request on GitHub
*merge-pr               # Merge pull request
*deploy                 # Deploy to production/staging
*ci-status              # Check CI/CD pipeline status
```

**Example**:
```bash
# After @dev completes Phase 3 and @qa approves Phase 4
*push feat/e1-1-issue-creation
*create-pr "E1.1: Issue Creation - Implement issue hierarchy"
*ci-status              # Wait for all checks ✅
*merge-pr              # Merge to main after CI passes
```

---

## Rules to Remember

### 🚫 NEVER (Hard Blocks)

These commands CANNOT be run by @dev:

```bash
❌ git push              # Only @devops
❌ git push --force      # Only @devops
❌ gh pr create         # Only @devops
❌ gh pr merge          # Only @devops
```

### ✅ ALWAYS (Required Actions)

Before completing Phase 3:

```bash
✅ make test            # All tests must pass
✅ make lint            # All linting must pass
✅ git commit           # Atomic commits before next task
```

---

## Status Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Story Status Workflow                       │
└─────────────────────────────────────────────────────────────────┘

     Phase 1              Phase 2              Phase 3              Phase 4
     CREATE               VALIDATE             IMPLEMENT            QA
     @sm                  @po                  @dev                 @qa
       |                    |                    |                    |
       ↓                    ↓                    ↓                    ↓
    DRAFT ──────────────→ READY ──────────────→ INPROGRESS ───────→ INREVIEW
       ↑                                                               |
       |                                                               ↓
       |  ← NO-GO (fixes needed)                                    DONE
       |    from @po                                      (PASS/CONCERNS/WAIVED)
       |
       └─────────────────────────────────────────────────────────────┘
                         QA Loop (max 5 iterations)
                         @dev fixes → @qa re-reviews
```

---

## Common Commands Quick Reference

| Action | Command | Agent | Phase |
|--------|---------|-------|-------|
| Create story | `*create-story E1.1` | @sm | 1 |
| Validate story | `*validate E1.1` | @po | 2 |
| Start implementation | `*develop E1.1` | @dev | 3 |
| Run QA checks | `*qa-gate E1.1` | @qa | 4 |
| Fix QA issues | `*qa-loop E1.1` | @dev+@qa | 4 |
| Push to remote | `*push` | @devops | N/A |
| Create PR | `*create-pr "title"` | @devops | N/A |
| Check rules | `*rules` | Any | N/A |
| Show status | `*status` | Any | N/A |
| Get help | `*help` | Any | N/A |

---

## File Locations

- **Commands config**: `.claude/commands.json`
- **Authority rules**: `.claude/rules/agent-authority.md`
- **Story lifecycle**: `.claude/rules/story-lifecycle.md`
- **IDS principles**: `.claude/rules/ids-principles.md`
- **Story files**: `docs/stories/{epic}.{id}.story.md`
- **Session handoffs**: `docs/sessions/{year}-{month}/session-{date}.md`

---

## Support

For issues with AIOS commands:
1. Check `.claude/rules/` for detailed rules
2. Run `*help` for current agent help
3. Consult `.claude/commands.json` for configuration
4. Escalate to @aios-master if authority unclear

