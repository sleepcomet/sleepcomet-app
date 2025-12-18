'use client';

import { useEffect, useRef } from 'react';

const MONITORING_INTERVAL = 30000; // 30 seconds in milliseconds

export function useMonitoring() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const runMonitoring = async () => {
      try {
        const response = await fetch('/api/monitoring/check');

        if (!response.ok) {
          console.error('Monitoring check failed:', response.status);
        } else {
          const data = await response.json();
          console.log('✅ Monitoring check completed:', data);
        }
      } catch (error) {
        console.error('❌ Monitoring check error:', error);
      }
    };

    // Run immediately on mount
    console.log('🚀 Starting automatic monitoring...');
    runMonitoring();

    // Then run every minute
    intervalRef.current = setInterval(runMonitoring, MONITORING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('🛑 Monitoring stopped');
      }
    };
  }, []);
}
