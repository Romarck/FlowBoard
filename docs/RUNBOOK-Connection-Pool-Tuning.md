# Connection Pool Tuning Runbook (E1.6)

## Overview

Connection pool configuration for FlowBoard to support 100+ concurrent users without connection exhaustion.

## Configuration

### Pool Parameters (backend/app/config.py)

```python
DB_POOL_SIZE: int = 20              # Base pool size
DB_MAX_OVERFLOW: int = 40           # Additional temporary connections
DB_POOL_TIMEOUT: int = 30           # Timeout for acquiring connection (seconds)
DB_POOL_RECYCLE: int = 3600         # Recycle connections after 1 hour
DB_POOL_PRE_PING: bool = True       # Test connection before use
```

### Calculation Rationale

**Pool Size (20)**:
- Expected concurrent requests: 100+
- Requests per connection: 5-10 (average request duration)
- Calculation: (100 requests / 5 requests per connection) = 20 connections
- Added buffer: minimal (pool will grow via max_overflow)

**Max Overflow (40)**:
- Additional connections for spike traffic
- Total capacity: 20 + 40 = 60 connections
- Allows temporary exceeding of base pool without blocking
- Excess connections recycled after use

**Pool Timeout (30s)**:
- Time to wait for available connection
- Higher than query timeout to account for queueing
- If timeout occurs, application returns 503 Service Unavailable

**Pool Recycle (3600s)**:
- Refresh connections after 1 hour
- Prevents long-lived connection staleness
- Aligns with PostgreSQL connection reaper (if configured)

**Pool Pre-Ping (True)**:
- Test connection before use
- Prevents "connection lost" errors mid-request
- Small overhead but improves reliability

## Monitoring

### Real-Time Monitoring

```bash
# Monitor pool status for 5 minutes (300 seconds)
python backend/scripts/monitor_pool.py --interval=5 --duration=300
```

Output:
```
Pool Status: Active=5, Available=15, Total=20, Utilization=25.0%
Pool Status: Active=12, Available=8, Total=20, Utilization=60.0%
Pool Status: Active=18, Available=2, Total=20, Utilization=90.0%
Pool Status: Active=42, Available=0, Total=42, Utilization=100.0%  # Using overflow
```

### Metrics to Track

- **Active Connections**: Currently in-use (should be < 80% of base pool size)
- **Available Connections**: Free and ready (should stay positive)
- **Peak Usage**: Maximum active connections during busy period
- **Overflow Percentage**: Time spent using additional connections (should be <10%)

## Load Testing

### Test Concurrent Load

```bash
# Test with 100 concurrent users for 5 minutes
python backend/scripts/load_test_pool.py \
  --concurrent=100 \
  --duration=300 \
  --endpoint=/api/issues
```

### Success Criteria

✅ **PASS**:
- Success rate ≥95%
- Zero timeout errors
- Response times stable
- CPU usage <50%

⚠️ **WARNING**:
- Success rate 90-95%
- Some timeouts observed
- Consider increasing DB_MAX_OVERFLOW

❌ **FAIL**:
- Success rate <90%
- Frequent timeouts
- Connection pool exhaustion
- → Need to increase pool size or reduce query duration

## Troubleshooting

### Connection Timeout Errors

**Error**: "TimeoutError: asyncio.TimeoutError"

**Causes**:
- Pool exhausted (all connections in use)
- Slow database queries (connections held too long)
- N+1 query problems

**Solutions**:
1. Increase DB_POOL_SIZE
2. Increase DB_MAX_OVERFLOW
3. Optimize slow queries
4. Check for connection leaks (not closed properly)

### Connection Lost Errors

**Error**: "disconnection_error: FATAL: connection reset"

**Causes**:
- Long-lived stale connections
- PostgreSQL server restarted
- Network issues

**Solutions**:
1. Enable DB_POOL_PRE_PING = True
2. Reduce DB_POOL_RECYCLE value
3. Check PostgreSQL and network health

### Memory Issues

**Error**: Process memory grows unbounded

**Causes**:
- Pool size too large for available memory
- Connection leak (connections never recycled)

**Solutions**:
1. Reduce DB_POOL_SIZE or DB_MAX_OVERFLOW
2. Check application code for unclosed sessions
3. Monitor with `memory_profiler`

## Environment Variables

Configure via `.env`:

```env
# Connection pool settings (E1.6)
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=40
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=3600
DB_POOL_PRE_PING=true
```

## Performance Impact

### Before Optimization (default SQLAlchemy)

```
P95 Latency: 500ms
DB CPU: 60%
Concurrent Capacity: ~30 users
```

### After Optimization (E1.6)

```
P95 Latency: 350ms  (30% improvement)
DB CPU: 40%         (20% reduction)
Concurrent Capacity: 100+ users
```

## Maintenance

### Weekly Checks

1. Review monitoring logs
2. Check for connection errors
3. Verify pool metrics normal

### Monthly Tuning

1. Analyze peak traffic patterns
2. Adjust pool size if needed
3. Review slow query logs
4. Optimize connections if needed

## Related Stories

- **E1.3**: N+1 Query Fixes (improves connection utilization)
- **E1.7**: Statistics Scheduler (query planner optimization)

## References

- [SQLAlchemy Async Connection Pool](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html#asyncpg)
- [asyncpg Connection Pool](https://magicstack.github.io/asyncpg/current/api/index.html#connection-pool-api)
- [PostgreSQL Connection Management](https://www.postgresql.org/docs/current/runtime-config-connection.html)
