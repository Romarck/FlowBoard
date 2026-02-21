# PostgreSQL Statistics Scheduler Runbook (E1.7)

## Overview

Automatic PostgreSQL table statistics refresh (`ANALYZE`) scheduled daily to optimize query planner decisions.

## What is ANALYZE?

`ANALYZE` collects table statistics (row counts, data distribution, null percentages) used by PostgreSQL's query planner to:
- Choose optimal execution plans
- Select appropriate indexes
- Estimate join costs

Without current statistics, the query planner makes poor decisions, resulting in slow queries.

## Setup

### Option 1: pg_cron Extension (Recommended)

**Pros**: Runs inside PostgreSQL, no external dependencies, easy to manage
**Cons**: Requires pg_cron extension installed

#### Install pg_cron

```bash
# Connect to database
psql -U flowboard -d flowboard

# Create extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

# Schedule ANALYZE for 2 AM daily
SELECT cron.schedule('analyze-tables', '0 2 * * *', 'ANALYZE;');

# View scheduled jobs
SELECT jobid, jobname, schedule, command FROM cron.job;
```

#### Cron Syntax

```
0 2 * * *
│ │ │ │ │
│ │ │ │ └─ Day of week (0-7, 0/7 = Sunday)
│ │ │ └─── Month (1-12)
│ │ └───── Day of month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

**Examples**:
- `0 2 * * *` — 2:00 AM every day
- `0 3 * * 0` — 3:00 AM every Sunday
- `*/6 * * * *` — Every 6 hours
- `0 * * * *` — Every hour at :00

### Option 2: Linux Cron (Fallback)

**Pros**: No PostgreSQL extension required, standard Linux
**Cons**: External process, harder to debug

#### Setup Script

```bash
./backend/scripts/schedule_analyze.sh cron
```

This creates:
- `/usr/local/bin/flowboard-analyze.sh` — Execution script
- Cron job in user crontab — Triggers daily at 2 AM

#### Manual Setup

```bash
# Edit crontab
crontab -e

# Add this line (2 AM daily)
0 2 * * * PGPASSWORD=flowboard_dev psql -h localhost -U flowboard -d flowboard -c "ANALYZE;" >> /var/log/flowboard-analyze.log 2>&1
```

## Monitoring

### Check Job Status

#### pg_cron

```sql
-- List all scheduled jobs
SELECT jobid, jobname, schedule, command, active FROM cron.job;

-- View job run history
SELECT jobid, jobname, start_time, end_time, status FROM cron.job_run_details;

-- See last run time
SELECT jobname, max(end_time) as last_run FROM cron.job_run_details GROUP BY jobname;
```

#### Linux Cron

```bash
# Check crontab
crontab -l

# View logs
tail -f /var/log/flowboard-analyze.log

# Check if job ran
grep flowboard-analyze /var/log/syslog  # or journalctl
```

### Verify Statistics Updated

```sql
-- Check last analyze time for all tables
SELECT schemaname, tablename, last_analyze, last_autoanalyze
FROM pg_stat_user_tables
ORDER BY last_analyze DESC;

-- Check if statistics are stale (older than 1 day)
SELECT schemaname, tablename, last_analyze,
       NOW() - last_analyze as age
FROM pg_stat_user_tables
WHERE last_analyze < NOW() - INTERVAL '1 day'
ORDER BY age DESC;
```

### Monitor Job Execution Time

```sql
-- Check ANALYZE runtime
SELECT mean_time, max_time FROM cron.job_run_details
WHERE jobname = 'analyze-tables';

-- Target: < 5 minutes (300000 ms)
```

## Troubleshooting

### Job Not Running

**Check pg_cron**

```sql
-- Verify extension is active
SELECT * FROM cron.job WHERE jobname = 'analyze-tables';

-- Check if cron job worker is running
SELECT * FROM cron.job_run_details WHERE jobname = 'analyze-tables' LIMIT 10;
```

**Check Linux Cron**

```bash
# Test cron environment
env -i /bin/sh -c 'cd /tmp && /usr/local/bin/flowboard-analyze.sh'

# Check system logs
sudo journalctl -u cron
sudo grep CRON /var/log/syslog
```

### Job Running Too Long

**Symptom**: ANALYZE takes >5 minutes

**Causes**:
- Large tables (GB-size)
- High disk I/O
- Insufficient CPU/RAM

**Solutions**:
1. Increase default_statistics_target (trade-off: more time, better stats)
2. Schedule during lower-traffic period
3. Monitor table growth and archive old data

```sql
-- Check large tables
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

### Manual ANALYZE (Emergency)

If scheduled job fails:

```bash
# Quick analyze (default sampling)
psql -U flowboard -d flowboard -c "ANALYZE;"

# Verbose analyze (see what's being analyzed)
psql -U flowboard -d flowboard -c "ANALYZE VERBOSE;"

# Force full analyze (slower but most accurate)
psql -U flowboard -d flowboard -c "SET default_statistics_target = 100; ANALYZE;"
```

## Performance Impact

### Before (Stale Statistics)

```
Query Plan: ❌ Suboptimal (query planner guessing)
Execution Time: 500ms-2s
Query Plan Used: Wrong index, poor join order
```

### After (Current Statistics)

```
Query Plan: ✅ Optimal (query planner informed)
Execution Time: 200-500ms
Query Plan Used: Right index, optimal join order
```

## Maintenance

### Weekly

- Check logs for errors
- Verify job ran at scheduled time
- Review latest statistics

### Monthly

- Analyze performance impact
- Adjust schedule if needed
- Check table growth

### Quarterly

- Review slow query logs
- Consider increasing statistics_target for large tables
- Archive old data if needed

## Related Stories

- **E1.3**: N+1 Query Fixes (improves query plan quality)
- **E1.6**: Connection Pool Tuning (complements statistics optimization)

## References

- [PostgreSQL ANALYZE Command](https://www.postgresql.org/docs/current/sql-analyze.html)
- [pg_cron Extension](https://github.com/citusdata/pg_cron)
- [PostgreSQL Query Planning](https://www.postgresql.org/docs/current/planner.html)
- [Statistics for Query Planning](https://www.postgresql.org/docs/current/planner-stats.html)
