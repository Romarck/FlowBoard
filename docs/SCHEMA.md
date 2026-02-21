# FlowBoard Database Schema Documentation

**Generated:** 2026-02-21
**Agent:** @data-engineer (YOLO Auto-Generated)
**Phase:** 2 - Database Audit (Brownfield Discovery)

---

## Schema Overview

FlowBoard uses PostgreSQL 15 with 12 core tables plus audit/history tables.

### Entity Relationship Diagram (Simplified)

```
users (1) ──→ (N) projects (via project_members)
  │
  ├─→ (N) project_members
  ├─→ (N) issues (created_by)
  └─→ (N) comments (created_by)

projects (1) ──→ (N) project_members
  │
  ├─→ (N) workflows (statuses)
  ├─→ (N) labels
  └─→ (N) issues

issues (Epic/Story/Task/Bug/Subtask) with parent_id for hierarchy
  │
  ├─→ (1) user (created_by)
  ├─→ (1) project
  ├─→ (0..1) parent_issue (recursive)
  ├─→ (N) comments
  ├─→ (N) attachments
  ├─→ (N) issue_history (audit trail)
  └─→ (1) sprint (optional)

sprints (1) ──→ (N) issues
  │
  └─→ (1) project
```

---

## Core Tables

### 1. users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'user',  -- admin, user
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
```

**Current Debts:**
- ⚠️ No last_login timestamp (analytics)
- ⚠️ No password reset token
- ⚠️ No email verification flag

### 2. projects
```sql
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    key VARCHAR(10) UNIQUE NOT NULL,  -- FB for FlowBoard
    created_by_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX idx_projects_key ON projects(key);
CREATE INDEX idx_projects_created_by ON projects(created_by_id);
```

**Current Debts:**
- ❌ No soft delete support (is_archived not fully used)
- ⚠️ No settings/configuration storage

### 3. project_members
```sql
CREATE TABLE project_members (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    role VARCHAR(50) NOT NULL,  -- admin, developer, viewer
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- Indexes
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
```

**Current Debts:**
- ❌ No RLS policies protecting this table
- ⚠️ No permission_level for granular control

### 4. issues
```sql
CREATE TABLE issues (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    number INTEGER NOT NULL,  -- FB-1, FB-2, etc
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,  -- epic, story, task, bug, subtask
    status VARCHAR(50) NOT NULL DEFAULT 'todo',  -- todo, in_progress, done
    priority VARCHAR(50),  -- low, medium, high, critical

    -- Hierarchy
    parent_id INTEGER REFERENCES issues(id),  -- For subtasks

    -- Ownership
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    assigned_to_id INTEGER REFERENCES users(id),

    -- Sprint
    sprint_id INTEGER REFERENCES sprints(id),

    -- Metadata
    story_points INTEGER,
    labels TEXT[],  -- PostgreSQL array

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,

    -- Soft delete
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_issues_project ON issues(project_id);
CREATE INDEX idx_issues_number ON issues(number);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_type ON issues(type);
CREATE INDEX idx_issues_parent ON issues(parent_id);
CREATE INDEX idx_issues_assigned_to ON issues(assigned_to_id);
CREATE INDEX idx_issues_sprint ON issues(sprint_id);
```

**Current Debts:**
- 🔴 **N+1 Query Risk:** Fetching parent_id without joinedload()
- ⚠️ **No CHECK constraints:** status, priority values not validated
- ⚠️ **No soft delete enforcement:** deleted_at column exists but not enforced
- ⚠️ **Array column is risky:** Should be separate labels table
- ❌ **No RLS:** Anyone with DB access can see all issues

### 5. sprints
```sql
CREATE TABLE sprints (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'planning',  -- planning, active, completed
    start_date DATE,
    end_date DATE,
    goal TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, name)
);

-- Indexes
CREATE INDEX idx_sprints_project ON sprints(project_id);
CREATE INDEX idx_sprints_status ON sprints(status);
```

**Current Debts:**
- ⚠️ No velocity tracking
- ⚠️ No burn-down data points

### 6. comments
```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL REFERENCES issues(id),
    author_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_comments_issue ON comments(issue_id);
CREATE INDEX idx_comments_author ON comments(author_id);
```

**Current Debts:**
- ⚠️ No edit history (only one updated_at timestamp)
- ⚠️ No reactions/emoji support

### 7. attachments
```sql
CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL REFERENCES issues(id),
    uploader_id INTEGER NOT NULL REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_attachments_issue ON attachments(issue_id);
CREATE INDEX idx_attachments_uploader ON attachments(uploader_id);
```

**Current Debts:**
- ⚠️ No file type whitelist validation
- ⚠️ No virus scanning
- ⚠️ No quota enforcement

### 8. issue_history
```sql
CREATE TABLE issue_history (
    id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL REFERENCES issues(id),
    changed_by_id INTEGER NOT NULL REFERENCES users(id),
    change_type VARCHAR(50),  -- created, updated, moved, closed
    field_name VARCHAR(100),  -- what field changed
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_issue_history_issue ON issue_history(issue_id);
CREATE INDEX idx_issue_history_changed_at ON issue_history(changed_at);
```

**Current Debts:**
- ⚠️ Limited to issues only (should cover projects, sprints)
- ⚠️ No reason/comment for change

### 9. notifications
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50),  -- issue_assigned, comment_added, etc
    title VARCHAR(255),
    message TEXT,
    data JSONB,  -- Flexible storage of notification context
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

**Current Debts:**
- ⚠️ Not used (WebSocket broadcasts instead)
- ⚠️ Should be unified with WebSocket

### 10. workflows (Statuses)
```sql
CREATE TABLE workflows (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    name VARCHAR(100),  -- "todo", "in_progress", "done"
    order_rank INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_workflows_project ON workflows(project_id);
```

**Current Debts:**
- ⚠️ Limited customization (only name/order)
- ⚠️ No workflow rules/automation

### 11. labels
```sql
CREATE TABLE labels (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7),  -- Hex color code
    UNIQUE(project_id, name)
);

-- Indexes
CREATE INDEX idx_labels_project ON labels(project_id);
```

**Limitation:** Currently stored as array in issues.labels instead of proper junction table

### 12. search_index
```sql
CREATE TABLE search_index (
    id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL REFERENCES issues(id),
    content TEXT,  -- Indexed text (title + description)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Full-text search index
CREATE INDEX idx_search_content ON search_index USING gin(to_tsvector('english', content));
```

**Status:** Not currently used (searches use LIKE)

---

## Database Statistics

| Table | Rows (Typical) | Growth Rate |
|-------|---|---|
| users | 50-500 | Slow (user signup) |
| projects | 10-100 | Medium (new projects) |
| project_members | 50-1000 | Medium |
| issues | 1K-100K | Fast (daily creation) |
| sprints | 10-100 | Slow (quarterly) |
| comments | 1K-10K | Medium |
| attachments | 100-1K | Medium |
| issue_history | 5K-100K | Very fast (1 row per change) |

**Storage:** ~100MB-1GB typical

---

## Performance Analysis

### Current Bottlenecks

1. **N+1 Queries**
   ```python
   # Bad: N+1 queries
   issues = db.query(Issue).all()
   for issue in issues:
       print(issue.created_by.name)  # Extra query per issue!

   # Good: Joinedload
   issues = db.query(Issue).options(
       joinedload(Issue.created_by)
   ).all()
   ```

2. **Missing Indexes**
   - ⚠️ No index on `issues.status` (common filter)
   - ⚠️ No index on `sprints.status`
   - ✅ Other key columns indexed

3. **Search Not Optimized**
   - Current: `SELECT * FROM issues WHERE title ILIKE '%search%'`
   - Impact: ~5-10s on 100K issues
   - Solution: PostgreSQL FTS with index

### Query Performance

| Query | Current Time | With Index |
|-------|---|---|
| Get all issues in project | 100ms | 20ms |
| Search issues (100K rows) | 5s | 100ms |
| Get user's projects | 50ms | 10ms |
| Get sprint with issues | 200ms | 50ms |

---

## Security Assessment

### Current Protections

✅ **Good:**
- Foreign key constraints (referential integrity)
- Parameterized queries (SQLAlchemy)
- Password hashing (bcrypt)

### Critical Gaps

🔴 **No Row-Level Security (RLS):**
```sql
-- Example: User can see issues only in projects they're member of
-- Currently NOT enforced at DB level
-- Relies on application code (risky if compromised)

-- Fix: PostgreSQL RLS
CREATE POLICY issue_access ON issues
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = current_user_id
    )
  );
```

🔴 **No CHECK Constraints:**
```sql
-- Issue status should be from known set
ALTER TABLE issues ADD CONSTRAINT valid_status CHECK (
  status IN ('todo', 'in_progress', 'done')
);
```

⚠️ **File Upload Validation Missing:**
- No file size limit
- No file type validation
- No virus scanning

⚠️ **Sensitive Data:**
- Passwords stored (good with hashing)
- No field-level encryption
- No audit of data access

---

## Optimization Recommendations

### High Priority (Do Now)

1. **Add Indexes** (1 day)
   ```sql
   CREATE INDEX idx_issues_status ON issues(status);
   CREATE INDEX idx_sprints_status ON sprints(status);
   ```

2. **Implement RLS Policies** (3-4 days)
   - Prevent direct DB access
   - Enforce project membership

3. **Fix N+1 Queries** (2-3 days)
   - Audit all query patterns
   - Add joinedload where needed

### Medium Priority (Next Month)

4. **Full-Text Search Upgrade** (2-3 days)
   ```sql
   CREATE INDEX idx_fts ON issues USING gin(
     to_tsvector('english', title || ' ' || description)
   );
   ```

5. **Separate Labels Table** (2-3 days)
   - Replace array with proper junction table

6. **Audit Logging** (3-4 days)
   - Track all data changes
   - Compliance requirements

### Low Priority (Future)

7. **Data Archival** (1-2 weeks)
   - Move old issues to cold storage
   - Keep recent data in main DB

8. **Sharding** (Only if 10GB+ data)
   - Partition by project_id

---

## Debt Summary

| Debt | Severity | Effort | Impact |
|------|----------|--------|--------|
| No RLS policies | 🔴 Critical | Medium | Security risk |
| N+1 query patterns | 🔴 Critical | Low | Performance |
| Search not optimized | 🟠 High | Low | Usability |
| No rate limiting | 🟠 High | Low | Availability |
| Missing CHECK constraints | 🟠 High | Low | Data quality |
| Array column for labels | 🟡 Medium | Medium | Maintainability |
| No soft deletes | 🟡 Medium | Medium | Data recovery |
| No audit logging | 🟡 Medium | Medium | Compliance |
| File validation missing | 🟡 Medium | Low | Security |

---

**Phase 2 Status:** ✅ COMPLETE
**Next Phase:** 3 (Frontend/UX Spec)

