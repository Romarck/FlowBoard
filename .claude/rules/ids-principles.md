# IDS Principles: REUSE > ADAPT > CREATE

The **Incremental Development System (IDS)** enforces a decision hierarchy for building features. Before creating new components, patterns, or utilities, verify you cannot reuse existing ones.

## The Hierarchy

```
          Decision
            |
          REUSE?
          /    \
        YES    NO
        |       |
       Use    ADAPT?
      it!     /   \
          YES      NO
          |        |
       Modify   CREATE
      existing    new
      pattern    pattern
```

### Level 1: REUSE

**Question**: Does a component/pattern matching our need already exist?

**Process**:
1. Search codebase for similar components
2. Check `squads/` registry if available
3. Look in `src/components/`, `src/hooks/`, `backend/app/`
4. Verify it solves 80%+ of the requirement

**If Match Found**:
- ✅ Import and use directly
- Document why it's the right fit
- Update the component to support your use case if minimal changes needed

**Example** (Frontend):
```typescript
// ❌ WRONG: Create new date formatting function
export function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

// ✅ RIGHT: Import existing utility from utils/
import { formatDate } from '@/utils/date-formatting'
```

**Example** (Backend):
```python
# ❌ WRONG: Create new validation function
def validate_email(email: str) -> bool:
    return '@' in email and '.' in email

# ✅ RIGHT: Use existing validation from common/
from app.common.validators import validate_email
```

---

### Level 2: ADAPT

**Question**: Is there an 80%+ match that can be adapted?

**Process**:
1. Identify the closest existing component
2. List required changes (≤3 modifications)
3. Check if changes are general-purpose or use-case-specific
4. If general-purpose → update original component
5. If use-case-specific → create wrapper/adapter

**If Match + Minor Changes**:
- ✅ Modify existing component or create adapter
- Document the adaptation in comments
- Add generalized parameter if pattern applies elsewhere

**Example** (Frontend - Modify existing):
```typescript
// Original component: src/components/Button.tsx
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

// ✅ ADAPT: Add variant prop to existing component
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'  // ← Added
}
```

**Example** (Backend - Create adapter):
```python
# Original service: app/issues/service.py
class IssueService:
    def list_issues(self, project_id: str) -> List[Issue]:
        ...

# ✅ ADAPT: Create adapter for specific use case
class IssueExportService:
    def __init__(self, base_service: IssueService):
        self.base_service = base_service

    def list_issues_for_export(self, project_id: str) -> List[ExportIssue]:
        issues = self.base_service.list_issues(project_id)
        return [self._to_export_format(i) for i in issues]
```

**Red Flags for ADAPT**:
- ❌ Changes affect >30% of the component
- ❌ Breaking changes to existing API
- ❌ Use case is completely different
- → Go to Level 3: CREATE

---

### Level 3: CREATE

**Question**: Is a completely new component justified?

**Process**:
1. Verify no REUSE or ADAPT option exists
2. Check with @architect for pattern guidance
3. Design the component for general use
4. Document why creation was necessary

**If No Match Exists**:
- ✅ Create new component with:
  - Clear naming convention
  - JSDoc/docstring documentation
  - Type safety (TypeScript/Python type hints)
  - At least one test
  - Exported from barrel export if module-level

**Example** (Frontend - New Component):
```typescript
/**
 * DragDropIssueBoard - Sortable issue board with dnd-kit
 *
 * Use when:
 * - Need visual board with drag/drop capabilities
 * - Issues have multiple columns (statuses)
 *
 * Don't use when:
 * - Simple list view (use IssueList instead)
 * - Single issue details (use IssueDetail instead)
 */
export function DragDropIssueBoard({
  issues,
  onReorder
}: DragDropIssueBoardProps) {
  // Implementation
}
```

**Example** (Backend - New Service):
```python
class NotificationService:
    """
    Handles real-time notifications via WebSocket.

    Use when:
    - Need to notify users of changes in real-time
    - Multiple users subscribed to same resource

    Patterns:
    - connection_manager: Central registry of active connections
    - broadcast: Send to all subscribers
    - notify: Send to specific user
    """

    def __init__(self, manager: ConnectionManager):
        self.manager = manager

    async def broadcast(self, message: dict) -> None:
        """Send message to all connected clients."""
```

---

## Verification Gates

Before creating new components, verify:

### Gate 1: Codebase Search
```bash
# Frontend
grep -r "MyComponent" src/

# Backend
grep -r "my_service" backend/app/
```
- ✅ Found existing? → Go to REUSE
- ❌ Not found? → Continue

### Gate 2: Registry Check
- Check `squads/` directory for shared components
- Check component libraries (shadcn/ui for frontend, shared utils for backend)
- ✅ Found? → Go to REUSE or ADAPT
- ❌ Not found? → Continue

### Gate 3: Pattern Match
- Similar logic/structure elsewhere?
- Can be generalized?
- ✅ Yes? → Go to ADAPT
- ❌ No? → Continue to CREATE

### Gate 4: @architect Review
- Before creating, consult @architect
- Ensure pattern aligns with architecture
- Verify naming conventions match project
- ✅ Approved? → Proceed with CREATE
- ❌ Concerns? → Revisit REUSE/ADAPT

---

## Decision Documentation

When creating new components, document in comments:

```typescript
/**
 * WHY CREATED (IDS Gate 4 - No REUSE/ADAPT option):
 * - No existing drag/drop board with multi-column layout
 * - Custom column types needed (Epic, Story, Task, etc.)
 * - Existing components only support single-list layout
 *
 * WHEN TO USE:
 * - Multi-column kanban board with issue hierarchy
 * - Drag/drop between columns
 *
 * WHEN NOT TO USE:
 * - Simple list view → Use IssueList
 * - Single-status issues → Use Table component
 *
 * ALTERNATIVES CONSIDERED:
 * - Adapt existing DragDropList → Rejected (column logic incompatible)
 * - Use react-beautiful-dnd → Rejected (dnd-kit preferred per @architect)
 */
export function DragDropIssueBoard(...) { ... }
```

---

## Project-Specific Patterns

### Frontend (React + TypeScript)

**REUSE Library**:
- `src/components/ui/` → Radix/shadcn components
- `src/components/{feature}/` → Feature-specific components
- `src/hooks/useXQuery.ts` → Data fetching hooks
- `src/utils/` → Helper functions

**ADAPT Pattern** (modify existing):
- Adding variants to existing component
- Extending hook with additional parameters
- Creating wrapper components

**CREATE When**:
- No component exists for feature
- Query pattern differs significantly
- Custom hook needed for feature logic

### Backend (FastAPI + SQLAlchemy)

**REUSE Library**:
- `app/common/` → Shared validators, security, pagination
- `app/{domain}/service.py` → Business logic services
- Database models in appropriate module

**ADAPT Pattern**:
- Create service wrapper for specific use case
- Extend existing model with computed properties
- Create filter/query classes for specializations

**CREATE When**:
- No service exists for domain
- Validation rules are unique
- Database schema extension needed

---

## Examples of REUSE

### Frontend - Using Existing Hook

```typescript
// ✅ REUSE existing hook
import { useIssuesQuery } from '@/hooks/useIssuesQuery'

function MyComponent() {
  const { data: issues } = useIssuesQuery.useGetIssues({ projectId: '123' })
  return <IssueList issues={issues} />
}
```

### Frontend - Using Existing Component

```typescript
// ✅ REUSE existing component
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'

export function DeleteIssueDialog() {
  return (
    <Dialog>
      <DialogContent>
        <p>Delete issue?</p>
        <Button onClick={handleDelete}>Delete</Button>
      </DialogContent>
    </Dialog>
  )
}
```

### Backend - Using Existing Service

```python
# ✅ REUSE existing service
from app.issues.service import IssueService

async def move_issue_to_sprint(issue_id: str, sprint_id: str):
    service = IssueService(db)
    issue = await service.get_issue(issue_id)
    issue.sprint_id = sprint_id
    await service.update_issue(issue)
```

---

## Examples of ADAPT

### Frontend - Adapting Component

```typescript
// Original: Button.tsx
interface ButtonProps {
  label: string
  onClick: () => void
}

// ✅ ADAPT: Add loading state (general use)
interface ButtonProps {
  label: string
  onClick: () => void
  loading?: boolean
}

export function Button({ label, onClick, loading }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={loading}>
      {loading ? 'Loading...' : label}
    </button>
  )
}
```

### Backend - Creating Adapter

```python
# Original: IssueService
class IssueService:
    async def list_issues(self, project_id: str) -> List[Issue]: ...

# ✅ ADAPT: Create adapter for CSV export use case
class IssueExportAdapter:
    def __init__(self, service: IssueService):
        self.service = service

    async def get_issues_for_csv(self, project_id: str) -> List[dict]:
        issues = await self.service.list_issues(project_id)
        return [self._to_csv_format(i) for i in issues]
```

---

## Examples of CREATE

### Frontend - New Component

```typescript
/**
 * IssueHierarchyTree - Renders Epic > Story > Task > Bug > Subtask hierarchy
 * Created because: No existing component handles full hierarchy visualization
 * See: docs/architecture/component-decisions.md
 */
export function IssueHierarchyTree({ issues }: Props) {
  // Implementation
}
```

### Backend - New Service

```python
class SprintService:
    """
    Manages sprint lifecycle: planning → active → completed.
    Created because: No existing service handles sprint state transitions.
    """

    async def create_sprint(self, project_id: str, data: CreateSprintPayload) -> Sprint:
        ...

    async def activate_sprint(self, sprint_id: str) -> Sprint:
        ...
```

---

## Overrides

Can we override IDS principle?

**Only with**:
- Explicit `--override-ids "{justification}"` from @aios-master
- Documented in architecture decision record (ADR)
- Team consensus on exception

**Example**:
```
--override-ids "Performance critical path requires custom array iteration loop.
Existing utilities add 15% overhead. Tested and benchmarked. See doc/perf-analysis.md"
```

---

## Audit & Measurement

Track IDS compliance:

- REUSE: Measured in component reuse ratio
- ADAPT: Tracked in component modification history
- CREATE: Logged in ADR (Architecture Decision Records)

Review quarterly for patterns and improvement opportunities.

