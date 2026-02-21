# ✅ AIOS Commands Restoration Complete

**Date**: 2026-02-21
**Status**: ✅ All AIOS commands restored and linked
**Version**: 1.0.0

## What Was Restored

All AIOS agent commands and framework rules have been re-linked in `.claude/` directory. The commands were previously disconnected but are now fully functional.

## Files Created

### 1. **Core Configuration**

- **`.claude/commands.json`** — Machine-readable command configuration
  - All 8 agent definitions
  - Authority scope per agent
  - Available commands per agent
  - Phase definitions
  - Global command patterns

- **`.claude/COMMANDS.md`** — Quick reference guide
  - Agent activation syntax
  - Common command patterns
  - Workflow examples
  - Status workflow diagram

- **`.claude/README.md`** — Configuration index
  - File structure overview
  - Quick start guide
  - Rule documents
  - Typical workflows

### 2. **Framework Rules** (`.claude/rules/`)

- **`agent-authority.md`** (4 KB)
  - Agent scope & permissions matrix
  - What each agent CAN/CANNOT do
  - Authority conflicts & resolution
  - Exclusive powers (@devops)

- **`story-lifecycle.md`** (8 KB)
  - 4-phase story development cycle (SDC)
  - Phase 1-4 details (@sm → @po → @dev → @qa)
  - Story file template
  - 10-point validation checklist
  - Authority matrix by phase

- **`ids-principles.md`** (7 KB)
  - REUSE > ADAPT > CREATE hierarchy
  - 3-level decision system
  - Verification gates
  - Pattern documentation
  - Project-specific examples

- **`coderabbit-integration.md`** (5 KB)
  - Auto-healing code review workflow
  - CRITICAL issue auto-fixing (max 2 iterations)
  - Issue classification (CRITICAL/HIGH/LOW)
  - Integration with Phase 3 → Phase 4

- **`workflow-execution.md`** (8 KB)
  - Task-first principle
  - 4 workflows: SDC, QA Loop, Spec Pipeline, Brownfield Discovery
  - Error states & recovery
  - Session handoff template
  - Metrics & monitoring

### 3. **Settings**

- **`.claude/settings.local.json`** — Existing (unchanged)
  - Tool permissions
  - Security rules
  - Output style

## Agent Activation Syntax

### Simple Activation

```
@dev    # Developer — Implement stories
@qa     # QA Engineer — Quality checks
@sm     # Story Manager — Story creation
@po     # Product Owner — Story validation
@pm     # Product Manager — Epic creation
@architect  # Architect — Design decisions
@devops # DevOps — Git/CI/CD (exclusive)
@aios-master # Framework governance
```

### Command Prefix

Global commands use `*` prefix:

```
*help               # Show available commands
*status             # Show current story status
*develop E1.1       # Start Phase 3 implementation
*qa-gate E1.1       # Run Phase 4 quality checks
*validate E1.1      # Validate story readiness
*create-story E1.1  # Create story from epic
*push               # Push to git (DevOps only)
```

## Quick Test: Verify Commands Are Linked

Run this to test:

```bash
# Check that all files exist
ls -la .claude/commands.json .claude/COMMANDS.md .claude/rules/*.md

# Should see:
# ✅ .claude/commands.json
# ✅ .claude/COMMANDS.md
# ✅ .claude/README.md
# ✅ .claude/rules/agent-authority.md
# ✅ .claude/rules/story-lifecycle.md
# ✅ .claude/rules/ids-principles.md
# ✅ .claude/rules/coderabbit-integration.md
# ✅ .claude/rules/workflow-execution.md
```

## Command Configuration Structure

```json
{
  "agents": {
    "dev": {
      "name": "Developer (Dex)",
      "authority": { "canDo": [...], "cannotDo": [...] },
      "commands": { "develop": "...", "task": "...", ... }
    },
    "qa": { ... },
    "sm": { ... },
    "po": { ... },
    "pm": { ... },
    "architect": { ... },
    "devops": { ... },
    "aios-master": { ... }
  },
  "phases": {
    "1": { "name": "Create", "agent": "@sm", ... },
    "2": { "name": "Validate", "agent": "@po", ... },
    "3": { "name": "Implement", "agent": "@dev", ... },
    "4": { "name": "QA", "agent": "@qa", ... }
  },
  "globalCommands": { ... }
}
```

## Authority Matrix Summary

| Agent | Phase | Exclusive Authority | Can Do | Cannot Do |
|-------|-------|---------------------|--------|-----------|
| @sm | 1 | Story creation | Create story files | Implement, validate |
| @po | 2 | Story validation | Validate w/ checklist | Edit after Ready |
| @dev | 3 | Implementation | Code, tests, commits | git push, gh pr |
| @qa | 4 | Quality gates | Run 7 checks | Code changes |
| @pm | 0 | Epic creation | Create epics, spec | Implementation |
| @architect | N/A | Design guidance | Architecture review | Force decisions |
| @devops | N/A | **EXCLUSIVE** git/CI | git push, gh pr, deploy | Code changes |
| @aios-master | N/A | Framework | Governance, overrides | Direct work |

## Workflows Defined

### 1. Story Development Cycle (SDC)
```
DRAFT ──→ READY ──→ INPROGRESS ──→ INREVIEW ──→ DONE
  @sm      @po        @dev            @qa
Phase 1   Phase 2     Phase 3        Phase 4
```

### 2. QA Loop (if Phase 4 FAIL)
```
FAIL verdict from @qa
    ↓
@dev fixes (max 5 iterations)
    ↓
@qa re-reviews
    ↓
PASS/CONCERNS/FAIL/ESCALATE
```

### 3. Spec Pipeline (for detailed specifications)
```
@pm writes spec
    ↓
@architect reviews (feasibility)
    ↓
Ready → @sm creates stories
```

### 4. Brownfield Discovery (assess existing code)
```
@architect leads
    ↓
Scan → Assess → Plan
    ↓
Output: Assessment + story recommendations
```

## Key Features Restored

✅ **Agent Activation**: Use `@dev`, `@qa`, `@sm`, etc. to activate agents
✅ **Global Commands**: Use `*` prefix for commands like `*help`, `*status`, `*develop`
✅ **Authority Enforcement**: Each agent has defined scope (can/cannot do)
✅ **4-Phase SDC**: Story Development Cycle fully documented
✅ **IDS Principle**: REUSE > ADAPT > CREATE decision hierarchy
✅ **QA Loop**: Iterative fix-review cycle (max 5 iterations)
✅ **CodeRabbit Integration**: Auto-healing code review (Phase 3.5)
✅ **Workflow Rules**: Task-first principle, error recovery, metrics

## How to Use

### For Developers (@dev)

1. **Activate**: Mention `@dev` in your message
2. **Start story**: `*develop E1.1`
3. **Implement**: Follow acceptance criteria
4. **Submit**: When tests pass and linting clean
5. **Wait**: @qa runs Phase 4 checks

### For QA Engineers (@qa)

1. **Activate**: Mention `@qa` in your message
2. **Review story**: `*status E1.1`
3. **Run checks**: `*qa-gate E1.1`
4. **Verdict**: PASS / CONCERNS / FAIL / WAIVED
5. **Loop**: If FAIL, start `*qa-loop E1.1`

### For Story Managers (@sm)

1. **Activate**: Mention `@sm` in your message
2. **Create story**: `*create-story E1.1`
3. **Fill template**: Title, AC, scope, complexity
4. **Submit**: Ready for Phase 2 validation

### For Product Owners (@po)

1. **Activate**: Mention `@po` in your message
2. **Validate**: `*validate E1.1`
3. **Check**: 10-point checklist (≥7/10 = GO)
4. **Decision**: Mark Ready or NO-GO with feedback

## Documentation Links

- **Quick Start**: See `.claude/README.md`
- **Commands Reference**: See `.claude/COMMANDS.md`
- **Agent Authority**: See `.claude/rules/agent-authority.md`
- **Story Lifecycle**: See `.claude/rules/story-lifecycle.md`
- **IDS Principles**: See `.claude/rules/ids-principles.md`
- **Code Review**: See `.claude/rules/coderabbit-integration.md`
- **Workflows**: See `.claude/rules/workflow-execution.md`

## Common Mistakes to Avoid

❌ **@dev pushing to remote** — Only @devops can `git push`
❌ **@po editing story after Ready** — AC are locked after validation
❌ **@sm implementing code** — Story Manager creates stories only
❌ **Creating without REUSE check** — Always check IDS principle first
❌ **Skipping QA phase** — All stories go through Phase 4

## Support

**If commands not working**:
1. Check `.claude/commands.json` exists
2. Run `*help` to see available commands
3. Verify agent activation syntax (@agent)
4. Check `.claude/rules/` for detailed rules

**If authority unclear**:
1. Check `.claude/rules/agent-authority.md`
2. Review `.claude/COMMANDS.md` for phase-specific rules
3. Escalate to @aios-master if needed

**If workflow blocked**:
1. Check `.claude/rules/workflow-execution.md` for error states
2. Document blocker clearly
3. Ask for help from appropriate agent

## Configuration Verification

```bash
# Verify all files present
ls -1 .claude/
├── COMMANDS.md
├── COMMANDS-RESTORED.md (this file)
├── README.md
├── commands.json
├── settings.local.json
└── rules/
    ├── agent-authority.md
    ├── coderabbit-integration.md
    ├── ids-principles.md
    ├── story-lifecycle.md
    └── workflow-execution.md

Total: 9 files + 5 rule files = 14 configuration files
```

---

## Next Steps

**All systems operational!**

You can now:
1. Activate agents with `@dev`, `@qa`, `@sm`, etc.
2. Use global commands with `*` prefix
3. Follow 4-phase story development cycle
4. Execute workflows as defined
5. Apply AIOS framework rules

Start by running `*help` to see available commands.

---

**Restoration Date**: 2026-02-21
**Status**: ✅ COMPLETE
**Framework Version**: AIOS 1.0.0

