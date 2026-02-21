#!/usr/bin/env python3
"""
Load test script for connection pool tuning (E1.6).

Tests concurrent database connections to verify pool can handle 100+ users
without connection exhaustion or timeouts.

Usage:
    python scripts/load_test_pool.py --concurrent=100 --duration=300 --endpoint=/api/issues
"""

import asyncio
import time
from datetime import datetime
import httpx
import argparse
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class LoadTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results = {
            "total_requests": 0,
            "successful": 0,
            "failed": 0,
            "timeout": 0,
            "errors": [],
            "response_times": [],
        }

    async def make_request(self, endpoint: str, client: httpx.AsyncClient) -> bool:
        """Make single request and track result."""
        try:
            start = time.time()
            response = await asyncio.wait_for(
                client.get(f"{self.base_url}{endpoint}"),
                timeout=5.0
            )
            duration = time.time() - start

            self.results["total_requests"] += 1
            self.results["response_times"].append(duration)

            if response.status_code == 200:
                self.results["successful"] += 1
                return True
            else:
                self.results["failed"] += 1
                self.results["errors"].append(f"Status {response.status_code}")
                return False

        except asyncio.TimeoutError:
            self.results["total_requests"] += 1
            self.results["timeout"] += 1
            self.results["errors"].append("Timeout")
            return False
        except Exception as e:
            self.results["total_requests"] += 1
            self.results["failed"] += 1
            self.results["errors"].append(str(e))
            return False

    async def run_concurrent_test(
        self,
        concurrent_users: int,
        duration_seconds: int,
        endpoint: str = "/api/issues"
    ):
        """Run concurrent load test."""
        logger.info(f"🚀 Starting load test: {concurrent_users} concurrent users for {duration_seconds}s")
        logger.info(f"Endpoint: {endpoint}")

        start_time = time.time()
        tasks = []

        async with httpx.AsyncClient(timeout=None) as client:
            while time.time() - start_time < duration_seconds:
                # Maintain concurrent_users tasks
                active_tasks = [t for t in tasks if not t.done()]

                while len(active_tasks) < concurrent_users:
                    task = asyncio.create_task(
                        self.make_request(endpoint, client)
                    )
                    tasks.append(task)
                    active_tasks.append(task)

                # Log progress every 10 seconds
                if int(time.time() - start_time) % 10 == 0:
                    elapsed = time.time() - start_time
                    rate = self.results["total_requests"] / elapsed if elapsed > 0 else 0
                    logger.info(
                        f"⏱️  {int(elapsed)}s: {self.results['total_requests']} total requests, "
                        f"{rate:.1f} req/s, Success: {self.results['successful']}, "
                        f"Failed: {self.results['failed']}, Timeout: {self.results['timeout']}"
                    )

                await asyncio.sleep(0.1)

            # Wait for remaining tasks
            await asyncio.gather(*tasks, return_exceptions=True)

    def print_report(self):
        """Print test results report."""
        logger.info("\n" + "=" * 70)
        logger.info("📊 LOAD TEST REPORT (E1.6 Connection Pool Tuning)")
        logger.info("=" * 70)

        if self.results["total_requests"] == 0:
            logger.error("No requests were made")
            return

        success_rate = (self.results["successful"] / self.results["total_requests"]) * 100
        avg_response_time = (
            sum(self.results["response_times"]) / len(self.results["response_times"])
            if self.results["response_times"] else 0
        )

        logger.info(f"✅ Total Requests: {self.results['total_requests']}")
        logger.info(f"✅ Successful: {self.results['successful']} ({success_rate:.1f}%)")
        logger.info(f"❌ Failed: {self.results['failed']}")
        logger.info(f"⏱️  Timeout: {self.results['timeout']}")
        logger.info(f"\n📈 Performance Metrics:")
        logger.info(f"   Average Response Time: {avg_response_time*1000:.2f}ms")
        logger.info(f"   Min Response Time: {min(self.results['response_times'])*1000:.2f}ms")
        logger.info(f"   Max Response Time: {max(self.results['response_times'])*1000:.2f}ms")

        if self.results["errors"]:
            logger.info(f"\n⚠️  Error Summary:")
            error_counts = {}
            for error in self.results["errors"]:
                error_counts[error] = error_counts.get(error, 0) + 1

            for error, count in sorted(error_counts.items(), key=lambda x: x[1], reverse=True):
                logger.info(f"   {error}: {count}")

        # Verdict
        logger.info("\n🎯 Verdict:")
        if success_rate >= 95 and self.results["timeout"] == 0:
            logger.info("✅ PASS: Pool configuration handles load well")
        elif success_rate >= 90:
            logger.info("⚠️  WARNING: Some timeouts or failures detected")
        else:
            logger.info("❌ FAIL: Pool exhaustion or serious connection issues")

        logger.info("=" * 70 + "\n")


async def main():
    parser = argparse.ArgumentParser(description="Connection Pool Load Test")
    parser.add_argument("--concurrent", type=int, default=100, help="Number of concurrent users")
    parser.add_argument("--duration", type=int, default=300, help="Test duration in seconds")
    parser.add_argument("--endpoint", type=str, default="/api/issues", help="API endpoint to test")
    parser.add_argument("--base-url", type=str, default="http://localhost:8000", help="Base API URL")

    args = parser.parse_args()

    tester = LoadTester(base_url=args.base_url)
    await tester.run_concurrent_test(
        concurrent_users=args.concurrent,
        duration_seconds=args.duration,
        endpoint=args.endpoint
    )
    tester.print_report()


if __name__ == "__main__":
    asyncio.run(main())
