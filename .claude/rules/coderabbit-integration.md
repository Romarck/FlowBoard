# CodeRabbit Integration Rules

This document defines how CodeRabbit auto-healing code review integrates with AIOS Phase 3 (Development).

## Overview

CodeRabbit is a self-healing code review tool that automatically runs after @dev completes Phase 3 implementation. It helps catch and fix issues before manual QA review in Phase 4.

## Integration Points

### When CodeRabbit Runs

**Trigger**: After @dev finishes Phase 3 implementation

**Conditions**:
- All acceptance criteria implemented
- `make test` passing ✅
- `make lint` passing ✅
- Git commit(s) created
- Story marked "ready for QA" by @dev

**Timing**: Between Phase 3 → Phase 4 submission

## Issue Classification

CodeRabbit categorizes issues into severity levels:

### 🔴 CRITICAL

**Definition**: Issues that:
- Break functionality
- Cause test failures
- Expose security vulnerabilities
- Violate OWASP top 10
- Commit secrets/credentials

**Auto-Healing**: ✅ YES (Max 2 iterations)
- CodeRabbit auto-fixes
- @dev reviews and approves fix OR
- @dev makes manual fix if auto-fix inadequate
- Resubmit for Phase 4

**If CRITICAL persists after 2 iterations**:
- ⛔ HALT — Do not proceed to Phase 4
- Manual fix required by @dev
- Escalate to @architect if fix unclear
- Resubmit after manual fix

### 🟡 HIGH

**Definition**: Issues that:
- Impact code quality significantly
- Violate established patterns
- Create technical debt
- Reduce test coverage <80%
- Performance regression detected

**Auto-Healing**: ❌ NO (Suggestion only)
- CodeRabbit suggests fix
- @dev reviews suggestion
- @dev implements fix OR accepts as-is with justification
- Proceed to Phase 4

**@qa Note**: HIGH issues are part of Phase 4 QA checklist

### 🟢 LOW

**Definition**: Issues that:
- Style/formatting differences
- Minor code organization
- Documentation suggestions
- Type hints missing
- Comment clarity

**Auto-Healing**: ❌ NO (Informational only)
- CodeRabbit notes suggestions
- @dev can address or defer (document why)
- Proceed to Phase 4

**Note**: LOW issues typically don't block Phase 4 progress

## Auto-Healing Workflow

### Iteration 1: Initial CodeRabbit Review

```
@dev completes Phase 3
        ↓
*submit for QA
        ↓
CodeRabbit auto-review runs
        ↓
Issues found?
  ├─ CRITICAL (Fixable) → Auto-fix applied
  ├─ CRITICAL (Manual) → @dev makes manual fix
  ├─ HIGH → @dev reviews suggestion
  └─ LOW → @dev reviews for info
```

### If CRITICAL Auto-Fix Applied (Iteration 1)

```
CodeRabbit auto-fix applied
        ↓
@dev reviews fix
        ↓
Looks good?
  ├─ YES → @dev approves fix
  │        CodeRabbit creates new commit
  │        Proceed to Phase 4
  │
  └─ NO  → @dev makes manual adjustments
           CodeRabbit runs review again (Iteration 2)
```

### If CRITICAL Issues Persist (Iteration 2)

```
CodeRabbit Iteration 2
        ↓
Still have CRITICAL?
  ├─ NO CRITICAL → Proceed to Phase 4 ✅
  │
  └─ YES CRITICAL → ⛔ HALT
                    @dev makes manual fix
                    Run CodeRabbit again (manual)
                    If still CRITICAL → Escalate @architect
```

## Configuration

### CodeRabbit Config File (if using)

Place in repo root: `.coderabbit.yaml` or `.github/coderabbit.yaml`

**Example config**:
```yaml
rules:
  severity_levels:
    critical:
      # Security issues, test failures, broken logic
      patterns:
        - security_vulnerability
        - test_failure
        - logic_error
        - hardcoded_credential
    high:
      # Code quality, pattern violations
      patterns:
        - code_smell
        - pattern_violation
        - test_coverage_drop
    low:
      # Style, formatting, suggestions
      patterns:
        - formatting
        - naming_convention
        - documentation

  auto_fix_severity: CRITICAL
  max_iterations: 2

  check_points:
    - syntax_validity
    - type_safety
    - test_passing
    - no_secrets
    - owasp_compliance
```

## Best Practices

### For @dev (Phase 3)

**Before submitting for Phase 4**:
1. Run `make test` locally — ensure all pass
2. Run `make lint` locally — ensure no errors
3. Run your own code review before submission
4. Check for hardcoded secrets/credentials
5. Verify test coverage ≥80% for new code

**During CodeRabbit review**:
1. Don't ignore CRITICAL issues
2. Review auto-fixes carefully before approving
3. If unsure about auto-fix, make manual fix instead
4. Document why you're not following a suggestion (if valid reason)

**After CodeRabbit review**:
1. If CRITICAL auto-fixed → Approve and proceed
2. If CRITICAL manual fix needed → Fix, run CodeRabbit again
3. If HIGH/LOW issues → Address or document (proceed to Phase 4)

### For @qa (Phase 4)

**During QA review**:
1. Check CodeRabbit iteration count
2. Note if CRITICAL issues were found and resolved
3. Verify @dev's responses to HIGH/LOW issues
4. Mark "Code Pattern" check as ✅ if CodeRabbit passed

## Issue Examples

### CRITICAL Example 1: Security Vulnerability

```python
# ❌ CRITICAL: Hardcoded credential
api_key = "sk-1234567890abcdef"  # API key exposed!

# ✅ AUTO-FIX applied:
from os import getenv
api_key = getenv("OPENAI_API_KEY")
```

**CodeRabbit Action**: Auto-fix ✅
**@dev Action**: Review and approve

### CRITICAL Example 2: Test Failure

```python
# ❌ CRITICAL: New code breaks test
def process_issue(issue):
    # Missing input validation
    return issue.split(',')[0]  # IndexError if empty!

# ✅ AUTO-FIX applied:
def process_issue(issue):
    if not issue:
        raise ValueError("Issue cannot be empty")
    parts = issue.split(',')
    return parts[0] if parts else None
```

**CodeRabbit Action**: Auto-fix ✅
**@dev Action**: Review and approve

### HIGH Example: Pattern Violation

```python
# ❌ HIGH: Service layer missing (pattern violation)
@router.post("/issues")
def create_issue(payload: dict):
    db.add(Issue(**payload))
    return issue

# ✅ SUGGESTION: Follow service layer pattern
# CodeRabbit suggests:
@router.post("/issues")
async def create_issue(payload: CreateIssueDTO):
    service = IssueService(db)
    issue = await service.create_issue(payload)
    return issue
```

**CodeRabbit Action**: Suggestion only ⚠️
**@dev Action**: Implement suggestion or document why not

### LOW Example: Documentation

```python
# ❌ LOW: Missing docstring
def validate_email(email):
    return '@' in email and '.' in email

# ✅ SUGGESTION: Add docstring
def validate_email(email: str) -> bool:
    """Validate email format.

    Args:
        email: Email address to validate

    Returns:
        True if valid email format, False otherwise
    """
    return '@' in email and '.' in email
```

**CodeRabbit Action**: Suggestion only 📝
**@dev Action**: Nice to have, can skip

## Troubleshooting

### "CodeRabbit Iteration Limit Exceeded"

If CodeRabbit hits max iterations (2) with CRITICAL issues:

```
❌ CodeRabbit could not auto-fix all CRITICAL issues
   Iterations: 2/2 exhausted
   Remaining CRITICAL:
   - Security: XXX
   - Logic: XXX

🚨 HALT Phase 3 → Phase 4
   @dev must make manual fixes

✅ After manual fixes:
   1. Run CodeRabbit manually (one-time review)
   2. Verify no CRITICAL remain
   3. Escalate to @architect if unclear
   4. Resubmit for Phase 4
```

### "Auto-Fix Created Invalid Code"

If CodeRabbit's auto-fix introduces new issues:

```
❌ CodeRabbit auto-fix broken
   New error introduced

✅ @dev response:
   1. Revert auto-fix
   2. Make manual fix instead
   3. Run CodeRabbit again (manual)
   4. Verify fix passes review
   5. Proceed to Phase 4
```

### "Disagree with CodeRabbit Classification"

If you disagree with severity level:

```
❌ CodeRabbit marked as CRITICAL, but I disagree

✅ Document in Dev Notes:
   "CodeRabbit flagged XYZ as CRITICAL.
    However, [justification why it's not critical].
    Proceeding with current implementation."

   This goes to @qa for Phase 4 review.
```

## Integration with AIOS

### Phase 3 Timeline

```
@dev implements
    ↓
Git commit ready
    ↓
make test ✅ && make lint ✅
    ↓
CodeRabbit review (Automatic)
    ↓
CRITICAL issues?
  ├─ YES (Fixable)  → Auto-fix → @dev approves → OK ✅
  ├─ YES (Manual)   → @dev fixes → CodeRabbit again → OK ✅
  └─ NO             → Proceed to Phase 4 ✅
    ↓
Submit for Phase 4 (@qa review)
```

### Authority During CodeRabbit

| Phase | Agent | Action |
|-------|-------|--------|
| 3 | @dev | Submit for CodeRabbit |
| 3.5 | CodeRabbit | Auto-review, suggest/fix |
| 3 | @dev | Review and approve/fix |
| 4 | @qa | Final quality check |

**CodeRabbit is NOT authoritative** — it's advisory between @dev and @qa.

## Metrics & Monitoring

Track CodeRabbit effectiveness:

- CRITICAL issues caught per story
- Auto-fix acceptance rate
- Manual fix rate
- Phase 3 to Phase 4 transition time
- QA findings vs. CodeRabbit findings

Review metrics quarterly for process improvement.

## FAQ

**Q: Can CodeRabbit approve a story for Phase 4?**
A: No. CodeRabbit is advisory. Only @qa can approve Phase 4.

**Q: What if CodeRabbit auto-fix is obviously wrong?**
A: @dev reverts it and makes manual fix. Then submit again.

**Q: Does CodeRabbit count against 5-iteration QA Loop?**
A: No. CodeRabbit iterations are in Phase 3. QA Loop iterations are in Phase 4 with @qa.

**Q: Can I skip CodeRabbit review?**
A: No. All Phase 3 submissions go through CodeRabbit before Phase 4.

**Q: What if CodeRabbit finds an issue in existing code (not my changes)?**
A: Create separate issue/story. Phase 3 story only addresses acceptance criteria.

