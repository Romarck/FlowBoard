# 🚀 FlowBoard AIOS Quick Start

**Status**: ✅ AIOS is fully operational and ready to use

> **Note**: Commands don't appear with `/` suggestions yet, but you can still use them by typing them directly. See examples below.

---

## 📌 How to Use AIOS Commands

### Method 1: Direct Activation (Use This)
Just type the agent name directly in your message:

```
@dev
```

When you do this, Claude Code activates the developer agent with all its powers and available commands.

---

## 🎯 Agent Activation Shortcuts

Simply mention the agent and the command in your message:

### **Developer (@dev)** — Phase 3: Implementation
```
@dev *develop E1.1              # Start implementing story E1.1
@dev *status                    # Show your current story status
@dev *task {task-name}          # Execute a specific task
```

### **QA Engineer (@qa)** — Phase 4: Quality Checks
```
@qa *qa-gate E1.1               # Run quality checks on story E1.1
@qa *qa-loop E1.1               # Start QA Loop (iterative review)
@qa *check {check-name}         # Run specific quality check
```

### **Story Manager (@sm)** — Phase 1: Story Creation
```
@sm *create-story E1.1          # Create new story E1.1
@sm *validate-format            # Validate story file format
@sm *list-drafts                # Show all Draft status stories
```

### **Product Owner (@po)** — Phase 2: Story Validation
```
@po *validate E1.1              # Validate story against 10-point checklist
@po *approve E1.1               # Mark story as Ready after validation
@po *checklist                  # Show 10-point validation checklist
```

### **Product Manager (@pm)** — Phase 0: Epic Creation
```
@pm *create-epic E1             # Create new epic E1
@pm *spec                       # Write specification for feature
@pm *breakdown                  # Break epic into stories
```

### **Architect** — Design Decisions
```
@architect *design              # Propose architectural design
@architect *review              # Review architecture of story/component
@architect *ids-check           # Evaluate REUSE > ADAPT > CREATE
@architect *recommend           # Recommend technology/pattern
```

### **DevOps (@devops)** — Git/CI/CD (EXCLUSIVE AUTHORITY)
```
@devops *push                   # Push committed changes to remote
@devops *create-pr              # Create pull request on GitHub
@devops *merge-pr               # Merge approved pull request
@devops *deploy                 # Deploy to production/staging
@devops *ci-status              # Check CI/CD pipeline status
```

### **AIOS Master (@aios-master)** — Framework Governance
```
@aios-master *help              # Show all available commands
@aios-master *status            # Show current phase/story status
@aios-master *rules             # Show AIOS framework rules
@aios-master *audit             # Show audit trail of decisions
```

---

## 📋 Common Workflows

### Workflow 1: Create & Implement a Story
```
Step 1: @sm *create-story E1.1
  ↓
Step 2: @po *validate E1.1  (if ≥7/10 score)
  ↓
Step 3: @dev *develop E1.1
  ↓
Step 4: @qa *qa-gate E1.1   (run quality checks)
```

### Workflow 2: QA Loop (if story fails Phase 4)
```
@qa *qa-loop E1.1
  ↓
@dev fixes issues
  ↓
@qa *qa-gate E1.1  (re-review)
  ↓ (repeat max 5 times, then escalate to @architect)
```

### Workflow 3: Push Code to Production
```
Step 1: @dev *commit          (create git commit)
  ↓
Step 2: @devops *push         (push to remote)
  ↓
Step 3: @devops *create-pr    (create pull request)
  ↓
Step 4: @devops *ci-status    (check CI/CD status)
  ↓
Step 5: @devops *merge-pr     (merge when approved)
```

---

## 🔑 Key Rules to Remember

### Never (❌ Blocks Immediately)
- ❌ Implement without showing options first
- ❌ Delete anything without asking
- ❌ Change something that works
- ❌ Pretend work is done when it isn't
- ❌ @dev cannot `git push` (only @devops)

### Always (✅ Best Practices)
- ✅ Commit before starting next task
- ✅ Run `make test && make lint` before submitting
- ✅ Follow IDS principle: REUSE > ADAPT > CREATE
- ✅ Check existing components before creating new
- ✅ Create session handoff in `docs/sessions/` at end

---

## 🎯 IDS Principle: REUSE > ADAPT > CREATE

Before creating anything new:

```
1. REUSE? ──→ Does similar component exist?
             YES ✅ → Use it!
             NO ↓

2. ADAPT? ──→ Can existing one be modified?
             YES ✅ → Modify it!
             NO ↓

3. CREATE ──→ Create new (document why!)
```

---

## 🎓 Example Usage Patterns

### Pattern 1: Start New Story Implementation
```
Message: @dev *develop E1.2

Claude Code will:
1. Activate developer authority scope
2. Show available Phase 3 commands
3. Help you start implementing story E1.2
4. Track your progress in story file
```

### Pattern 2: Validate Story Readiness
```
Message: @po *validate E1.1

Claude Code will:
1. Activate Product Owner authority
2. Show 10-point validation checklist
3. Score story readiness
4. Decision: GO (≥7/10) or NO-GO
```

### Pattern 3: Run Quality Gate
```
Message: @qa *qa-gate E1.1

Claude Code will:
1. Activate QA Engineer authority
2. Run 7-point quality checks
3. Verify acceptance criteria met
4. Verdict: PASS / CONCERNS / FAIL / WAIVED
```

---

## 📚 Configuration Files

All AIOS configuration stored in `.claude/`:

| File | Purpose |
|------|---------|
| `commands.json` | Machine-readable command registry |
| `COMMANDS.md` | Quick reference guide |
| `README.md` | Framework index |
| `rules/agent-authority.md` | Agent scope & permissions |
| `rules/story-lifecycle.md` | 4-phase SDC details |
| `rules/ids-principles.md` | REUSE > ADAPT > CREATE |
| `rules/coderabbit-integration.md` | Auto-healing code review |
| `rules/workflow-execution.md` | Workflow & handoff |
| `settings.local.json` | Tool permissions |

---

## 💡 Tips & Tricks

### Tip 1: Ask for Help
```
@aios-master *help
```
Shows all available commands and agent info.

### Tip 2: Check Status Anytime
```
@aios-master *status
```
Shows what phase you're in and next steps.

### Tip 3: See All Rules
```
@aios-master *rules
```
Display all AIOS framework rules.

### Tip 4: Combine with Context
Instead of just `@dev *develop E1.1`, you can add context:

```
@dev *develop E1.1
I've created the API endpoint in backend/app/issues/routes.py
and need to implement the frontend component next.
Show me the IDS gates I should check before creating the new component.
```

This gives Claude more context to help you effectively.

---

## ⚠️ Authority Boundaries

### @dev CAN
- ✅ Implement code per acceptance criteria
- ✅ Create git commits
- ✅ Write tests and debugging
- ✅ Update story File List
- ✅ Check off Dev Notes progress

### @dev CANNOT
- ❌ `git push` (only @devops)
- ❌ Create pull request (only @devops)
- ❌ Edit story AC/scope
- ❌ Change story status to Ready

---

## 🔗 Story File Locations

Stories are stored in `docs/stories/` with naming:
```
{EPIC}.{ID}-{title}.story.md

Examples:
- docs/stories/E1.1-issue-hierarchy.story.md
- docs/stories/E1.2-sprint-planning.story.md
- docs/stories/E2.1-notifications.story.md
```

---

## 📍 Phase Status Workflow

```
DRAFT ──→ READY ──→ INPROGRESS ──→ INREVIEW ──→ DONE
  ↑        ↑           ↑            ↑
 @sm      @po         @dev         @qa
Phase 1  Phase 2     Phase 3      Phase 4
```

---

## 🛠️ Troubleshooting

### "I don't see / suggestions for commands"
**Status**: ✅ Normal - Commands are still fully functional
**Solution**: Type the agent mention directly without waiting for `/` autocomplete

```
Good: @dev *develop E1.1
Not needed: Waiting for / suggestions
```

### "Unclear which command to use?"
**Solution**: Ask the framework
```
@aios-master *help
```

### "Unsure about authority boundaries?"
**Solution**: Check the rules
```
@aios-master *rules
```

### "Story validation unclear?"
**Solution**: Get the checklist
```
@po *checklist
```

---

## ✨ Next Steps

1. **Pick a story status**: Check `docs/stories/` for stories in Draft/Ready status
2. **Activate appropriate agent**: Use `@{agent}` mention
3. **Execute command**: Use `*{command}` with story ID
4. **Follow the framework**: Respect phase boundaries and authority rules
5. **Create handoff**: At end of session, create `docs/sessions/{date}/session-{date}.md`

---

## 📞 Need Help?

Run any of these:
```
@aios-master *help          # Show available commands
@aios-master *status        # Show current project status
@aios-master *rules         # Display all AIOS rules
```

Or check documentation:
- Framework rules: `.claude/rules/`
- Quick reference: `.claude/COMMANDS.md`
- Full details: `.claude/README.md`

---

**FlowBoard AIOS is ready to go!** 🚀

Start by activating any agent with `@{agent-name}` and use `*{command}` syntax.
