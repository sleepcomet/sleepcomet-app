#!/usr/bin/env python3
"""
SleepComet Endpoint Monitor
Monitors all endpoints and calculates accurate uptime percentages
"""

import os
import time
import asyncio
import aiohttp
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
CHECK_INTERVAL = 60  # Check every 60 seconds
REQUEST_TIMEOUT = 10  # 10 second timeout for requests

class EndpointMonitor:
    def __init__(self):
        self.db_conn = None
        self.session = None
        
    async def connect_db(self):
        """Connect to PostgreSQL database"""
        try:
            self.db_conn = psycopg2.connect(DATABASE_URL)
            print(f"[{datetime.now().isoformat()}] ✅ Connected to database")
        except Exception as e:
            print(f"[{datetime.now().isoformat()}] ❌ Database connection failed: {e}")
            raise
    
    def close_db(self):
        """Close database connection"""
        if self.db_conn:
            self.db_conn.close()
            print(f"[{datetime.now().isoformat()}] 🔌 Database connection closed")
    
    async def get_all_endpoints(self) -> List[Dict]:
        """Fetch all endpoints from database"""
        cursor = self.db_conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT id, name, url, status, uptime, "lastCheck"
            FROM endpoints
            ORDER BY name
        """)
        endpoints = cursor.fetchall()
        cursor.close()
        return endpoints
    
    async def check_endpoint(self, url: str) -> tuple[bool, float]:
        """
        Check if endpoint is up
        Returns: (is_up, response_time_ms)
        """
        start_time = time.time()
        try:
            timeout = aiohttp.ClientTimeout(total=REQUEST_TIMEOUT)
            async with self.session.get(url, timeout=timeout, allow_redirects=True) as response:
                response_time = (time.time() - start_time) * 1000
                is_up = 200 <= response.status < 500  # 2xx, 3xx, 4xx are considered "up"
                return (is_up, response_time)
        except asyncio.TimeoutError:
            response_time = REQUEST_TIMEOUT * 1000
            return (False, response_time)
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            print(f"[{datetime.now().isoformat()}] ⚠️  Error checking {url}: {e}")
            return (False, response_time)
    
    def calculate_uptime(self, endpoint_id: str, is_up: bool) -> float:
        """
        Calculate uptime percentage based on check history
        Stores check results in a separate table for accurate tracking
        """
        cursor = self.db_conn.cursor(cursor_factory=RealDictCursor)
        
        # Create checks table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS endpoint_checks (
                id SERIAL PRIMARY KEY,
                endpoint_id VARCHAR(255) NOT NULL,
                checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
                is_up BOOLEAN NOT NULL,
                response_time_ms FLOAT
            )
        """)
        
        # Create index for faster queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_endpoint_checks_endpoint_id 
            ON endpoint_checks(endpoint_id, checked_at DESC)
        """)
        
        self.db_conn.commit()
        
        # Get checks from last 90 days
        ninety_days_ago = datetime.now() - timedelta(days=90)
        cursor.execute("""
            SELECT is_up
            FROM endpoint_checks
            WHERE endpoint_id = %s 
            AND checked_at >= %s
            ORDER BY checked_at DESC
        """, (endpoint_id, ninety_days_ago))
        
        checks = cursor.fetchall()
        cursor.close()
        
        if not checks:
            # First check ever
            return 100.0 if is_up else 0.0
        
        # Calculate uptime percentage
        total_checks = len(checks)
        up_checks = sum(1 for check in checks if check['is_up'])
        uptime_percentage = (up_checks / total_checks) * 100
        
        return round(uptime_percentage, 2)
    
    def record_check(self, endpoint_id: str, is_up: bool, response_time: float):
        """Record a check result in the database"""
        cursor = self.db_conn.cursor()
        cursor.execute("""
            INSERT INTO endpoint_checks (endpoint_id, is_up, response_time_ms, checked_at)
            VALUES (%s, %s, %s, NOW())
        """, (endpoint_id, is_up, response_time))
        self.db_conn.commit()
        cursor.close()
    
    def update_endpoint_status(self, endpoint_id: str, is_up: bool, uptime: float):
        """Update endpoint status and uptime in database"""
        cursor = self.db_conn.cursor()
        status = "up" if is_up else "down"
        cursor.execute("""
            UPDATE endpoints
            SET status = %s, uptime = %s, "lastCheck" = NOW()
            WHERE id = %s
        """, (status, uptime, endpoint_id))
        self.db_conn.commit()
        cursor.close()
    
    async def monitor_all_endpoints(self):
        """Monitor all endpoints once"""
        endpoints = await self.get_all_endpoints()
        
        if not endpoints:
            print(f"[{datetime.now().isoformat()}] ℹ️  No endpoints to monitor")
            return
        
        print(f"[{datetime.now().isoformat()}] 🔍 Checking {len(endpoints)} endpoint(s)...")
        
        for endpoint in endpoints:
            endpoint_id = endpoint['id']
            url = endpoint['url']
            name = endpoint['name']
            
            # Check endpoint
            is_up, response_time = await self.check_endpoint(url)
            
            # Record the check
            self.record_check(endpoint_id, is_up, response_time)
            
            # Calculate uptime
            uptime = self.calculate_uptime(endpoint_id, is_up)
            
            # Update database
            self.update_endpoint_status(endpoint_id, is_up, uptime)
            
            # Log result
            status_emoji = "✅" if is_up else "❌"
            print(f"[{datetime.now().isoformat()}] {status_emoji} {name}: {url} - "
                  f"{'UP' if is_up else 'DOWN'} ({response_time:.0f}ms) - Uptime: {uptime}%")
    
    async def run(self):
        """Main monitoring loop"""
        await self.connect_db()
        
        # Create aiohttp session
        self.session = aiohttp.ClientSession()
        
        print(f"[{datetime.now().isoformat()}] 🚀 SleepComet Monitor started")
        print(f"[{datetime.now().isoformat()}] ⏱️  Check interval: {CHECK_INTERVAL} seconds")
        print(f"[{datetime.now().isoformat()}] ⏳ Request timeout: {REQUEST_TIMEOUT} seconds")
        print("-" * 80)
        
        try:
            while True:
                await self.monitor_all_endpoints()
                print(f"[{datetime.now().isoformat()}] 💤 Sleeping for {CHECK_INTERVAL} seconds...")
                print("-" * 80)
                await asyncio.sleep(CHECK_INTERVAL)
        except KeyboardInterrupt:
            print(f"\n[{datetime.now().isoformat()}] 🛑 Monitor stopped by user")
        finally:
            await self.session.close()
            self.close_db()

async def main():
    monitor = EndpointMonitor()
    await monitor.run()

if __name__ == "__main__":
    asyncio.run(main())
