# Agent Authority Matrix

This document defines the scope of authority for each AIOS agent. These rules are **non-negotiable** except with explicit `--override-ids` from @aios-master with documented justification.

## Authority Spheres

### @dev — Developer (Dex)

**Primary Responsibility**: Implement stories exactly per acceptance criteria

**CAN DO**:
- ✅ `git add` — Stage changes for commit
- ✅ `git commit` — Create atomic commits with story context
- ✅ `git branch` — Create feature branches
- ✅ Read/edit story File List
- ✅ Check off Dev Notes progress items `[x]`
- ✅ Implement features per acceptance criteria
- ✅ Write unit tests
- ✅ Run tests locally (`make test`)
- ✅ Run linters (`make lint`)
- ✅ Debug and fix code issues
- ✅ Request clarifications in Dev Notes
- ✅ Respond to code review feedback
- ✅ Create PR drafts (on feature branch)

**CANNOT DO**:
- ❌ `git push` — Push to remote (only @devops)
- ❌ `gh pr create` — Create pull request (only @devops)
- ❌ `gh pr merge` — Merge pull request (only @devops)
- ❌ Edit story title, description, AC (only @sm/@po)
- ❌ Change story status to "Ready" (only @po)
- ❌ Mark story as "Done" (only @qa)
- ❌ Change epic scope or status
- ❌ Create stories (only @sm)
- ❌ Delete files without @aios-master approval
- ❌ Force push to any branch
- ❌ Merge conflicting branches
- ❌ Change RBAC or permissions

**Boundaries**:
- MUST stay within acceptance criteria scope
- MUST pass all tests before submission
- MUST follow IDS principle (REUSE > ADAPT > CREATE)
- MUST commit before starting next task
- MUST document architectural questions for @architect

---

### @qa — QA Engineer

**Primary Responsibility**: Run 7-point quality checks on completed stories

**CAN DO**:
- ✅ Run comprehensive testing
- ✅ Review code patterns against codebase standards
- ✅ Check unit test coverage (≥80% target)
- ✅ Verify all acceptance criteria are met
- ✅ Regression test (run full test suite)
- ✅ Performance testing
- ✅ Security review
- ✅ Documentation review
- ✅ Fill QA Results section in story
- ✅ Set verdict (PASS / CONCERNS / FAIL / WAIVED)
- ✅ Request fixes from @dev (iterative QA Loop)
- ✅ Request architectural review from @architect
- ✅ Block story from Done status if FAIL

**CANNOT DO**:
- ❌ Implement code fixes (only @dev)
- ❌ Change story AC or scope (only @sm/@po)
- ❌ Create or manage stories
- ❌ `git` operations (only @dev/@devops)
- ❌ Push code changes
- ❌ Approve architectural decisions (recommend, don't decide)

**Boundaries**:
- MUST run all 7 quality checks
- MUST provide specific feedback for FAIL verdicts
- MUST not exceed 5 iterations in QA Loop per story
- MUST escalate to @architect after 5 QA Loop iterations

---

### @sm — Story Manager (River)

**Primary Responsibility**: Create stories from epics with proper structure

**CAN DO**:
- ✅ Create story files in `docs/stories/`
- ✅ Define story title and description
- ✅ Write acceptance criteria (Given/When/Then format)
- ✅ Set initial scope and complexity
- ✅ Identify risks and dependencies
- ✅ Set initial Effort Estimate
- ✅ Validate story file structure
- ✅ Ask for clarifications from @pm on epic intent
- ✅ Create Dev Notes section with empty checkboxes
- ✅ Request feedback from @po if unclear on AC interpretation

**CANNOT DO**:
- ❌ Create epics (only @pm)
- ❌ Change story status to "Ready" (only @po)
- ❌ Edit story after @po validates (locked)
- ❌ Implement code
- ❌ Approve or reject stories
- ❌ Change scope without @po guidance
- ❌ `git` operations

**Boundaries**:
- MUST follow story template exactly
- MUST include ≥2 acceptance criteria
- MUST write AC in Given/When/Then format
- MUST provide at least one risk assessment
- MUST not create stories without corresponding epic

---

### @po — Product Owner (Pax)

**Primary Responsibility**: Validate stories against 10-point checklist

**CAN DO**:
- ✅ Review stories against 10-point checklist
- ✅ Provide feedback to @sm on story quality
- ✅ Mark story as "Ready" (Phase 2 → 3)
- ✅ Edit acceptance criteria during validation phase (Draft status only)
- ✅ Request scope clarifications
- ✅ Prioritize stories in backlog
- ✅ Define acceptance criteria with @sm
- ✅ Reject story with required fixes
- ✅ Track acceptance criteria across stories

**CANNOT DO**:
- ❌ Create stories (only @sm)
- ❌ Create epics (only @pm)
- ❌ Implement code
- ❌ Edit story after marking "Ready"
- ❌ Change story status once in InProgress
- ❌ Approve QA results (only @qa)
- ❌ Make technical architecture decisions
- ❌ `git` operations

**Boundaries**:
- MUST use 10-point checklist for all validations
- MUST provide GO/NO-GO decision
- MUST not edit AC after story is Ready
- MUST document feedback clearly in story file
- MUST achieve ≥7/10 before marking Ready

---

### @pm — Product Manager (Morgan)

**Primary Responsibility**: Create epics and define product vision

**CAN DO**:
- ✅ Create epics with clear problem statements
- ✅ Write PRD/specifications
- ✅ Break down epics into story-sized pieces for @sm
- ✅ Define high-level success metrics
- ✅ Prioritize epics
- ✅ Request architectural recommendations
- ✅ Communicate with stakeholders
- ✅ Define scope and goals for features

**CANNOT DO**:
- ❌ Create stories (only @sm)
- ❌ Validate stories (only @po)
- ❌ Implement code
- ❌ Make technical decisions without @architect input
- ❌ Edit stories created by @sm
- ❌ Mark stories as Ready
- ❌ `git` operations

**Boundaries**:
- MUST provide clear problem statement in epic
- MUST break epic into stories for @sm (3-5 stories typically)
- MUST coordinate with @po on scope
- MUST respect @architect's technical constraints

---

### @architect — Architect

**Primary Responsibility**: Make architectural decisions, technology selection, design review

**CAN DO**:
- ✅ Propose architectural designs
- ✅ Recommend technology stack choices
- ✅ Review code architecture
- ✅ Evaluate IDS principle (REUSE > ADAPT > CREATE)
- ✅ Recommend design patterns
- ✅ Identify architectural risks
- ✅ Escalate after 5 QA iterations (architectural redesign)
- ✅ Review system decisions
- ✅ Guide @dev on complex implementations
- ✅ Create architecture decision records (ADR)

**CANNOT DO**:
- ❌ Implement code directly (guide @dev instead)
- ❌ Create stories or epics
- ❌ Create final git commits (only @dev)
- ❌ Override @qa quality gate decisions
- ❌ `git push` (only @devops)
- ❌ Make RBAC or permission decisions

**Boundaries**:
- MUST be consulted before major architectural changes
- MUST provide recommendations with alternatives
- MUST document decisions in architecture docs
- MUST not block implementation without justification

---

### @devops — DevOps (Gage)

**Primary Responsibility**: Git operations, CI/CD, infrastructure management

**EXCLUSIVE AUTHORITY** (only agent that can do these):
- ✅ `git push` to any branch (ONLY @devops can push)
- ✅ `gh pr create` — Create pull requests (ONLY @devops)
- ✅ `gh pr merge` — Merge pull requests (ONLY @devops)
- ✅ CI/CD pipeline management
- ✅ Environment configuration
- ✅ Deployment to production/staging
- ✅ Secret management
- ✅ Infrastructure changes
- ✅ Docker/Kubernetes operations
- ✅ MCP server configuration and management
- ✅ Database backup/restore operations

**CAN DO** (within exclusive scope):
- ✅ Trigger builds
- ✅ Monitor deployment status
- ✅ Rollback releases
- ✅ Manage environment variables
- ✅ Configure webhooks and integrations

**CANNOT DO**:
- ❌ Implement code features
- ❌ Make product decisions
- ❌ Create or validate stories
- ❌ Override QA verdicts
- ❌ Delete critical infrastructure without approval

**Boundaries**:
- MUST verify CI/CD passes before merge
- MUST document all deployment decisions
- MUST follow change management procedures
- MUST coordinate with @pm/@po on release timing

---

### @aios-master — AIOS Master Framework

**Primary Responsibility**: Framework governance, agent coordination, rule enforcement

**CAN DO**:
- ✅ Agent coordination
- ✅ Rule enforcement
- ✅ Override decisions with `--override-ids {justification}`
- ✅ Resolve inter-agent conflicts
- ✅ Update framework rules (with change log)
- ✅ Maintain audit trail
- ✅ Escalate exceptions

**CANNOT DO**:
- ❌ Implement code directly
- ❌ Make product decisions (defer to @pm)
- ❌ Make technical decisions (defer to @architect)
- ❌ Override @devops exclusive authority

**Boundaries**:
- MUST document all overrides
- MUST maintain audit trail of decisions
- MUST not create precedent without evaluation

---

## Conflict Resolution

If agents disagree on execution:

1. **Within Authority**: Agent with authority decides
   - Example: @dev and @qa disagree on implementation approach
   - Resolution: @architect recommends, @dev decides if within AC scope

2. **Cross-Authority**: Escalate to @aios-master
   - Example: @po wants to change AC during InProgress phase
   - Resolution: @aios-master determines if rule violation occurred

3. **Product Decision**: Escalate to @pm
   - Example: Story scope suddenly unclear
   - Resolution: @pm clarifies with stakeholders

4. **Technical Decision**: Consult @architect
   - Example: Multiple valid implementation approaches
   - Resolution: @architect recommends pattern per IDS principle

---

## Audit Trail

All agent actions are logged with:
- Agent ID
- Action taken
- Story ID (if applicable)
- Timestamp
- Justification (if override used)

Violation audit stored in `.claude/audit/violations.log`

---

## Summary Table

| Agent | Phase | Primary | Create | Validate | Implement | QA |
|-------|-------|---------|--------|----------|-----------|-----|
| @pm | 0 | Epic creation | ✅ | — | — | — |
| @sm | 1 | Story creation | ✅ | — | — | — |
| @po | 2 | Story validation | — | ✅ | — | — |
| @dev | 3 | Implementation | — | — | ✅ | — |
| @qa | 4 | Quality gate | — | — | — | ✅ |
| @architect | N/A | Design guidance | ✅ | ✅ | ✅ | ✅ |
| @devops | N/A | Git/CI/CD | — | — | — | ✅ (push) |
| @aios-master | N/A | Governance | ✅ | ✅ | ✅ | ✅ |

---

## Key Rules

1. **One Agent One Phase**: Each story phase has one responsible agent
2. **No Authority Bleed**: Agents stay within their sphere
3. **Exclusive Authority**: @devops has exclusive git/CI/CD authority
4. **Escalation Path**: Unclear → @aios-master
5. **Justification Required**: Overrides must be documented

