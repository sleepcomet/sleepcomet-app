'use client';

import { useMonitoring } from '@/hooks/use-monitoring';

export function MonitoringProvider() {
  useMonitoring();
  return null;
}
