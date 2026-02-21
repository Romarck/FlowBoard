#!/bin/bash
# Schedule PostgreSQL table statistics refresh (E1.7)
#
# This script sets up automatic ANALYZE jobs to run daily at 2 AM
# Two options provided:
#   Option 1: pg_cron extension (preferred) - managed within PostgreSQL
#   Option 2: Linux cron - external scheduling
#
# Usage:
#   ./schedule_analyze.sh (interactive menu)
#   ./schedule_analyze.sh pg_cron
#   ./schedule_analyze.sh cron

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-flowboard}"
DB_USER="${DB_USER:-flowboard}"

echo "PostgreSQL Statistics Scheduler (E1.7)"
echo "======================================"

# Check psql available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql not found. Install postgresql-client."
    exit 1
fi

# Option selection
if [ -z "$1" ]; then
    echo ""
    echo "Choose scheduling method:"
    echo "1) pg_cron extension (recommended)"
    echo "2) Linux cron (fallback)"
    read -p "Enter choice (1-2): " choice
else
    choice="$1"
fi

# Test database connection
echo ""
echo "Testing database connection..."
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
    echo "❌ Cannot connect to database"
    exit 1
fi
echo "✅ Connected to $DB_NAME"

# Option 1: pg_cron extension
if [ "$choice" = "1" ] || [ "$choice" = "pg_cron" ]; then
    echo ""
    echo "Setting up pg_cron extension..."

    # Create extension
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'SQL'
CREATE EXTENSION IF NOT EXISTS pg_cron;
SQL

    echo "✅ pg_cron extension installed"

    # Schedule ANALYZE for 2 AM daily
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'SQL'
-- Schedule daily ANALYZE at 2 AM
SELECT cron.schedule('analyze-tables', '0 2 * * *', 'ANALYZE;');
SQL

    echo "✅ Scheduled ANALYZE job: daily at 2:00 AM"

    # Verify job
    echo ""
    echo "Scheduled jobs:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'SQL'
SELECT jobid, jobname, schedule, command FROM cron.job WHERE jobname = 'analyze-tables';
SQL

    echo ""
    echo "✅ pg_cron setup complete!"

# Option 2: Linux cron
elif [ "$choice" = "2" ] || [ "$choice" = "cron" ]; then
    echo ""
    echo "Setting up Linux cron scheduler..."

    # Create cron script
    CRON_SCRIPT="/usr/local/bin/flowboard-analyze.sh"

    cat > "$CRON_SCRIPT" << 'SCRIPT'
#!/bin/bash
# Daily ANALYZE for FlowBoard (E1.7)

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-flowboard}
DB_USER=${DB_USER:-flowboard}
LOG_FILE="/var/log/flowboard-analyze.log"

echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting ANALYZE..." >> "$LOG_FILE"

if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "ANALYZE;" >> "$LOG_FILE" 2>&1; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ANALYZE completed successfully" >> "$LOG_FILE"
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ANALYZE failed" >> "$LOG_FILE"
fi
SCRIPT

    chmod +x "$CRON_SCRIPT"
    echo "✅ Created cron script: $CRON_SCRIPT"

    # Add to crontab
    echo "Adding to crontab (2 AM daily)..."

    # Create temp crontab
    TEMP_CRON=$(mktemp)
    crontab -l > "$TEMP_CRON" 2>/dev/null || true

    # Add job if not already present
    if ! grep -q "flowboard-analyze" "$TEMP_CRON"; then
        echo "0 2 * * * $CRON_SCRIPT" >> "$TEMP_CRON"
        crontab "$TEMP_CRON"
        echo "✅ Added cron job"
    else
        echo "⚠️  Cron job already exists"
    fi

    rm "$TEMP_CRON"

    echo ""
    echo "Current crontab:"
    crontab -l | grep "flowboard"

    echo ""
    echo "✅ Linux cron setup complete!"

else
    echo "❌ Invalid choice"
    exit 1
fi

echo ""
echo "📚 Documentation:"
echo "   See: docs/RUNBOOK-PostgreSQL-Statistics-Scheduler.md"
echo ""
echo "✅ PostgreSQL statistics scheduling configured!"
