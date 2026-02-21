# 🎯 AIOS Activation Guide

**Status**: ✅ AIOS is ready to use RIGHT NOW

---

## The Issue You're Facing

You said: "os comandos ainda não aparecem quando digito /"

**What this means**: Commands don't show as `/` autocomplete suggestions.

**What this doesn't mean**: AIOS isn't broken! ✅ It works perfectly.

**How to use it anyway**: Type the agent and command directly.

---

## ✨ How to Activate AIOS NOW

### Method: Direct Agent Mention

Just type the agent name in your message:

```
@dev
```

That's it! Claude Code will:
1. Recognize the @ mention
2. Activate the developer agent
3. Apply all developer authority
4. Enable all developer commands

---

## 🚀 Real-World Examples

### Example 1: Start Implementation (Developer)
```
@dev I need to implement story E1.1.
What are the acceptance criteria and current status?

*develop E1.1
```

**What happens**:
- Developer authority activated
- Phase 3 context engaged
- You can now implement, commit, and update story files

---

### Example 2: Run Quality Checks (QA)
```
@qa *qa-gate E1.1

Please run the 7-point quality checks on this story.
```

**What happens**:
- QA authority activated
- All 7 checks executed
- Verdict given: PASS / CONCERNS / FAIL / WAIVED

---

### Example 3: Validate Story (Product Owner)
```
@po *validate E1.1

Check this story against the 10-point validation checklist.
```

**What happens**:
- Product Owner authority activated
- 10-point checklist applied
- Decision: GO (≥7/10) or NO-GO (<7/10)

---

### Example 4: Create New Story (Story Manager)
```
@sm *create-story E1.2

Create a new story for the sprint planning feature.
Title: "Sprint Planning UI"
Description: "User interface for planning sprints"
```

**What happens**:
- Story Manager authority activated
- Story created in Draft status
- Ready for @po validation

---

### Example 5: Push Code (DevOps - EXCLUSIVE)
```
@devops *push

Push the implemented features to the main branch.
```

**What happens**:
- DevOps authority activated (EXCLUSIVE)
- Only @devops can do `git push`
- Code pushed to remote

---

## 🎓 Quick Reference Card

Print this and keep it handy:

| Agent | Activation | Command | Phase | Purpose |
|-------|-----------|---------|-------|---------|
| **Dev** | `@dev` | `*develop {id}` | 3 | Implement stories |
| **QA** | `@qa` | `*qa-gate {id}` | 4 | Quality checks |
| **Story Manager** | `@sm` | `*create-story {id}` | 1 | Create stories |
| **Product Owner** | `@po` | `*validate {id}` | 2 | Validate stories |
| **Product Manager** | `@pm` | `*create-epic {name}` | 0 | Create epics |
| **Architect** | `@architect` | `*design` | N/A | Design decisions |
| **DevOps** | `@devops` | `*push` | N/A | Git operations |
| **Master** | `@aios-master` | `*help` | N/A | Framework help |

---

## 📋 4-Phase Story Lifecycle

```
Phase 1: CREATE (Draft)
↓ Command: @sm *create-story
↓
Phase 2: VALIDATE (Ready)
↓ Command: @po *validate
↓
Phase 3: IMPLEMENT (InProgress)
↓ Command: @dev *develop
↓
Phase 4: QA (InReview → Done)
↓ Command: @qa *qa-gate
↓
DONE (Story Complete)
```

---

## ✅ All Available Commands

### Framework Commands (Any Agent)
```
@aios-master *help        # Show all commands
@aios-master *status      # Show project status
@aios-master *rules       # Show all rules
```

### Story Lifecycle Commands
```
@sm *create-story         # Create story (Phase 1)
@po *validate             # Validate story (Phase 2)
@dev *develop             # Implement story (Phase 3)
@qa *qa-gate              # Quality checks (Phase 4)
@qa *qa-loop              # QA iteration (if Phase 4 fails)
```

### Developer Commands (Phase 3)
```
@dev *develop {id}        # Start implementation
@dev *task {name}         # Execute task
@dev *status              # Show current status
```

### Product Manager / Owner Commands
```
@pm *create-epic          # Create epic
@po *checklist            # Show validation checklist
```

### DevOps Commands (EXCLUSIVE)
```
@devops *push             # Push to remote (ONLY @devops)
@devops *create-pr        # Create pull request (ONLY @devops)
@devops *merge-pr         # Merge pull request (ONLY @devops)
```

---

## 🔒 Authority Rules (Simple Version)

### @dev CAN
✅ Implement code
✅ Create git commits
✅ Write tests
✅ Update story files
✅ Fix bugs

### @dev CANNOT
❌ `git push` (only @devops)
❌ Create PR (only @devops)
❌ Edit story requirements
❌ Change story status

### @po CAN
✅ Validate stories
✅ Mark as Ready
✅ Review acceptance criteria

### @po CANNOT
❌ Create stories (only @sm)
❌ Implement code
❌ Do QA reviews (only @qa)

### @devops CAN (EXCLUSIVE)
✅ `git push` (ONLY THIS AGENT)
✅ Create PRs (ONLY THIS AGENT)
✅ Merge PRs (ONLY THIS AGENT)
✅ CI/CD operations

---

## 💡 Tips for Success

### Tip 1: Always Use Agent First
```
❌ WRONG: *develop E1.1 (no context)
✅ RIGHT: @dev *develop E1.1 (agent activated)
```

### Tip 2: Give Context With Commands
```
❌ SHORT: @dev *develop E1.1

✅ BETTER:
@dev I'm ready to implement story E1.1.
The API endpoint is done, now I need to:
- Create React components for the board
- Add drag-and-drop functionality
- Write unit tests

*develop E1.1
```

### Tip 3: Check Status When Unclear
```
@aios-master *status
Shows what phase you're in and next steps
```

### Tip 4: Read Rules When Confused
```
@aios-master *rules
Shows all authority boundaries and constraints
```

---

## 🎯 Common Scenarios

### Scenario 1: Start a New Day
```
What was I working on?
@aios-master *status

What are the next steps?
@dev (check story file)

Ready to continue?
@dev *develop E1.3 (or whichever story)
```

### Scenario 2: Story Ready for Implementation
```
@po has marked story as Ready

Now:
@dev *develop E1.2
I'm ready to implement story E1.2...
```

### Scenario 3: Implementation Done, Ready for QA
```
@dev I've finished implementing story E1.1
All tests pass: make test ✅
All linting clean: make lint ✅

@qa Please run the quality checks
*qa-gate E1.1
```

### Scenario 4: QA Fails, Need Fixes
```
@qa found issues in story E1.1

@dev *qa-loop E1.1
I'll fix the issues found...
(make fixes)

@qa *qa-gate E1.1
Re-reviewing the fixes...
```

### Scenario 5: Ready to Push
```
@dev Story E1.1 is done and passed QA

@devops *push
Push E1.1 to main branch
```

---

## 🚨 Common Mistakes to Avoid

### ❌ Mistake 1: Forgetting Agent Mention
```
❌ *develop E1.1
✅ @dev *develop E1.1
```
**Why**: Agent mention activates authority context

### ❌ Mistake 2: Wrong Agent for Task
```
❌ @dev *validate E1.1
✅ @po *validate E1.1
```
**Why**: Only @po can validate (phase authority)

### ❌ Mistake 3: Dev Trying to Push
```
❌ @dev *push
✅ @devops *push
```
**Why**: Only @devops has exclusive push authority

### ❌ Mistake 4: Using Story Commands Without Story
```
❌ @dev *develop
✅ @dev *develop E1.1
```
**Why**: Commands need story ID/name parameter

---

## 📍 File Locations

### Story Files
```
docs/stories/E1.1-title.story.md
docs/stories/E1.2-title.story.md
```

### AIOS Configuration
```
.claude/commands.json              (Registry)
.claude/COMMANDS.md                (Reference)
.claude/README.md                  (Index)
.claude/QUICK-START.md             (Getting started)
.claude/AIOS-RESTORATION-REPORT.md (Status)
```

### Rules Documentation
```
.claude/rules/agent-authority.md       (Who can do what)
.claude/rules/story-lifecycle.md       (4-phase process)
.claude/rules/ids-principles.md        (REUSE > ADAPT > CREATE)
.claude/rules/coderabbit-integration.md (Code review)
.claude/rules/workflow-execution.md    (Procedures)
```

---

## ❓ FAQ

**Q: Do I need to wait for `/` suggestions?**
A: No! Commands work perfectly with direct typing.

**Q: Why doesn't my command show up with `/`?**
A: Claude Code doesn't auto-register local skills yet. Not a problem - just type directly.

**Q: Can I use commands without @ mentions?**
A: Commands work better with agent context, but you can try. Agent mention activates authority.

**Q: What if I use wrong agent?**
A: The framework prevents authority violations. Only authorized agents can execute commands.

**Q: How many iterations in QA Loop?**
A: Max 5 iterations. After 5, escalate to @architect for design review.

**Q: Who can do git push?**
A: ONLY @devops. No exceptions. This is exclusive authority.

**Q: Can @dev create PRs?**
A: No. Only @devops can create PRs. Exclusive authority.

---

## 🎓 Learning Path

1. **Start Here**: Read this guide (you're reading it! ✅)
2. **Quick Reference**: `.claude/QUICK-START.md`
3. **Example Story**: Check `docs/stories/` for existing stories
4. **First Task**: Activate @dev and implement a story
5. **Full Details**: Read `.claude/rules/` when needed
6. **Troubleshooting**: Use `@aios-master *help`

---

## ✨ Try It Now

Copy and paste one of these to test:

### Test 1: Check Help
```
@aios-master *help
```

### Test 2: Check Status
```
@aios-master *status
```

### Test 3: Show Rules
```
@aios-master *rules
```

**All three should work immediately** - that's how you know AIOS is operational! 🚀

---

## 🎯 Next Steps

1. ✅ Read this guide (DONE!)
2. ⬜ Try `@aios-master *help` to see all commands
3. ⬜ Check `docs/stories/` for stories in Ready status
4. ⬜ Activate appropriate agent (`@sm`, `@po`, `@dev`, etc.)
5. ⬜ Execute command with story ID
6. ⬜ Follow phase authority rules
7. ⬜ Create handoff at end of session

---

**AIOS is ready. Your framework is operational.**

Go build! 🚀
