# AIOS Framework Configuration

This directory contains the AIOS (AI-Orchestrated System) configuration for FlowBoard. All commands have been restored and linked.

## 📋 File Structure

```
.claude/
├── commands.json                    ← Agent command configuration
├── COMMANDS.md                      ← Quick command reference guide
├── README.md                        ← This file
├── settings.local.json              ← Claude Code local settings
└── rules/
    ├── agent-authority.md           ← Agent scope & permissions
    ├── story-lifecycle.md           ← 4-phase story development cycle
    └── ids-principles.md            ← REUSE > ADAPT > CREATE hierarchy
```

## 🚀 Quick Start: Activating Agents

### Activate an Agent with @ Mention

```
@dev    # Developer (Dex)      - Implement stories, Phase 3
@qa     # QA Engineer          - Quality checks, Phase 4
@sm     # Story Manager (River) - Story creation, Phase 1
@po     # Product Owner (Pax)  - Story validation, Phase 2
@pm     # Product Manager (Morgan) - Epic creation, Phase 0
@architect # Architect         - Design decisions
@devops # DevOps (Gage)        - Git/CI/CD operations (EXCLUSIVE)
@aios-master # Framework       - Framework governance
```

## 📖 Command Reference

See **[COMMANDS.md](./COMMANDS.md)** for full command syntax and workflows.

### Common Commands (with `*` prefix)

```bash
*help                    # Show available commands
*status                  # Show current story status
*rules                   # Show AIOS framework rules
*develop {story-id}     # Start Phase 3 implementation
*qa-gate {story-id}     # Run Phase 4 quality checks
*create-story {epic}    # Create new story from epic
*validate {story-id}    # Validate story readiness
*push                   # Push to git (DevOps only)
```

## 📚 Rule Documents

### 1. **Agent Authority** (`rules/agent-authority.md`)
Defines what each agent **CAN** and **CANNOT** do:
- @dev boundaries
- @qa responsibilities
- @sm constraints
- @po authority
- @devops exclusive powers
- @architect guidance
- Conflict resolution

### 2. **Story Lifecycle** (`rules/story-lifecycle.md`)
Explains the 4-phase story development cycle:
- **Phase 1 (CREATE)**: @sm creates story from epic → Draft status
- **Phase 2 (VALIDATE)**: @po validates with 10-point checklist → Ready status
- **Phase 3 (IMPLEMENT)**: @dev implements per AC → InProgress status
- **Phase 4 (QA)**: @qa runs 7 quality checks → InReview → Done status

Also covers:
- Story file template
- Acceptance criteria format
- Authority matrix during each phase
- FAQ and troubleshooting

### 3. **IDS Principles** (`rules/ids-principles.md`)
Decision hierarchy: **REUSE > ADAPT > CREATE**

Before creating new components:
1. **REUSE** — Is there an existing component?
2. **ADAPT** — Can you modify an existing one?
3. **CREATE** — Only if no REUSE/ADAPT option

Includes verification gates and examples.

## 🔄 Typical Workflow

### As a Developer (@dev)

```
1. Activate: @dev
2. View story: *status E1.1
3. Start work: *develop E1.1
4. Edit files, test, commit
5. Update File List in story
6. Check off Dev Notes progress
7. Submit: Tests pass, linting clean
8. Wait for @qa review
```

### As QA (@qa)

```
1. Activate: @qa
2. Review story: *status E1.1
3. Run checks: *qa-gate E1.1
4. Fill QA Results
5. Verdict: PASS / CONCERNS / FAIL / WAIVED
6. If FAIL: *qa-loop E1.1 for iteration with @dev
```

### As Story Manager (@sm)

```
1. Activate: @sm
2. Get epic from @pm
3. Create story: *create-story E1.1
4. Fill story template
5. Submit for validation
6. Wait for @po feedback
```

### As Product Owner (@po)

```
1. Activate: @po
2. Review story: *status E1.1
3. Validate: *validate E1.1
4. Check 10-point checklist
5. Score: ≥7/10 → Ready, <7/10 → return to @sm
```

## 🔐 Authority Rules

**NEVER** (Hard Blocks):
- ❌ @dev cannot `git push` (only @devops)
- ❌ @dev cannot `gh pr create` (only @devops)
- ❌ @po cannot edit story after Ready status
- ❌ @sm cannot implement code

**ALWAYS**:
- ✅ Commit before starting next task
- ✅ Run `make test && make lint` before submitting
- ✅ Follow IDS principle: REUSE > ADAPT > CREATE
- ✅ Document decisions in code/stories

## 📍 Story File Locations

Stories are stored in `docs/stories/` with naming convention: `{EPIC}.{ID}-{title}.story.md`

**Example**:
- `docs/stories/E1.1-issue-hierarchy.story.md`
- `docs/stories/E1.2-sprint-planning.story.md`

## 🎯 Phase Status Workflow

```
DRAFT ──→ READY ──→ INPROGRESS ──→ INREVIEW ──→ DONE
  ↑        ↑           ↑            ↑
  @sm      @po         @dev         @qa
Phase 1   Phase 2     Phase 3      Phase 4
```

## 🛠️ Configuration Files

### commands.json
Machine-readable configuration of:
- All agent definitions
- Their authority scope
- Available commands per agent
- Phase definitions
- Global commands

### settings.local.json
Claude Code local settings for:
- Tool permissions
- Security rules
- Output style
- Thinking mode

## 📝 Session Handoff

At the end of each session, create a handoff document:

**Location**: `docs/sessions/{YYYY-MM}/session-{DATE}.md`

**Contents**:
- What was completed
- What's in progress (paused)
- Next steps for next session
- Important context (db state, env changes, etc.)
- Files modified
- Test status

## ⚡ Quick Troubleshooting

**Commands not working?**
- Verify agent is activated (@dev, @qa, etc.)
- Check `.claude/commands.json` is in place
- Run `*help` to see available commands

**Authority unclear?**
- Check `.claude/rules/agent-authority.md`
- Consult COMMANDS.md for phase-specific rules
- Escalate to @aios-master if needed

**Story status wrong?**
- Check `.claude/rules/story-lifecycle.md`
- Verify which phase story is in
- Only correct agent can change status

## 📞 Support

For help with AIOS:
1. Run `*help` to see available commands
2. Check `.claude/rules/` for detailed rules
3. Review `COMMANDS.md` for command reference
4. Consult `.claude/commands.json` for configuration
5. Escalate to @aios-master if authority unclear

---

**Status**: ✅ All AIOS commands restored and configured

**Last Updated**: 2026-02-21

**Framework Version**: 1.0.0

