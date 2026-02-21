#!/usr/bin/env python3
"""
Connection pool monitoring script (E1.6).

Monitors asyncpg connection pool status to track:
- Active connections
- Available connections
- Pool utilization
- Connection growth/churn

Usage:
    python scripts/monitor_pool.py --interval=5 --duration=300
"""

import asyncio
import sys
from datetime import datetime
import argparse
import logging
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import engine
from sqlalchemy import text

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class PoolMonitor:
    def __init__(self):
        self.samples = []

    async def get_pool_status(self):
        """Get current connection pool status."""
        pool = engine.pool

        status = {
            "timestamp": datetime.now(),
            "size": pool.size(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
            "total_connections": pool.size() + pool.overflow(),
        }

        return status

    async def log_status(self, status):
        """Log current pool status."""
        active = status["checked_out"]
        available = status["size"] - status["checked_out"]
        total = status["total_connections"]
        utilization = (active / status["size"] * 100) if status["size"] > 0 else 0

        logger.info(
            f"Pool Status: Active={active}, Available={available}, "
            f"Total={total}, Utilization={utilization:.1f}%"
        )

        self.samples.append(status)

    async def monitor(self, interval_seconds: int = 5, duration_seconds: int = 300):
        """Monitor pool status for specified duration."""
        logger.info(f"🔍 Monitoring connection pool (interval={interval_seconds}s, duration={duration_seconds}s)")
        logger.info(f"📊 Configured Pool Size: {engine.pool.size()}")

        start_time = asyncio.get_event_loop().time()
        iteration = 0

        while asyncio.get_event_loop().time() - start_time < duration_seconds:
            iteration += 1
            status = await self.get_pool_status()
            await self.log_status(status)

            await asyncio.sleep(interval_seconds)

        logger.info("✅ Monitoring complete")

    async def generate_report(self):
        """Generate monitoring report."""
        if not self.samples:
            logger.error("No samples collected")
            return

        max_active = max(s["checked_out"] for s in self.samples)
        avg_active = sum(s["checked_out"] for s in self.samples) / len(self.samples)
        peak_total = max(s["total_connections"] for s in self.samples)

        logger.info("\n" + "=" * 70)
        logger.info("📊 POOL MONITORING REPORT (E1.6)")
        logger.info("=" * 70)
        logger.info(f"Samples Collected: {len(self.samples)}")
        logger.info(f"Peak Active Connections: {max_active}")
        logger.info(f"Average Active Connections: {avg_active:.1f}")
        logger.info(f"Peak Total Connections: {peak_total}")
        logger.info("=" * 70 + "\n")


async def main():
    parser = argparse.ArgumentParser(description="Connection Pool Monitor")
    parser.add_argument("--interval", type=int, default=5, help="Monitoring interval (seconds)")
    parser.add_argument("--duration", type=int, default=300, help="Total monitoring duration (seconds)")

    args = parser.parse_args()

    monitor = PoolMonitor()
    await monitor.monitor(interval_seconds=args.interval, duration_seconds=args.duration)
    await monitor.generate_report()


if __name__ == "__main__":
    asyncio.run(main())
