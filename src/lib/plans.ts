// Plan configurations for check intervals
// minInterval: minimum interval in seconds (best the plan can do)
// maxInterval: maximum interval in seconds (worst/default)

export const PLAN_LIMITS = {
  FREE: {
    minInterval: 300,     // 5 minutes
    maxEndpoints: 50,
    maxStatusPages: 1,
    daysRetention: 3,
  },
  SOLO: {
    minInterval: 180,     // 3 minutes
    maxEndpoints: 60,
    maxStatusPages: 2,
    daysRetention: 30,
  },
  PRO: {
    minInterval: 60,      // 1 minute
    maxEndpoints: 100,
    maxStatusPages: 5,
    daysRetention: 90,
  },
  BUSINESS: {
    minInterval: 30,      // 30 seconds
    maxEndpoints: Infinity,
    maxStatusPages: Infinity,
    daysRetention: 365,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export function getMinInterval(plan: string): number {
  const planConfig = PLAN_LIMITS[plan as PlanType];
  return planConfig?.minInterval || PLAN_LIMITS.FREE.minInterval;
}

export function validateCheckInterval(plan: string, interval: number): number {
  const minInterval = getMinInterval(plan);
  // Ensure interval is at least the minimum for the plan
  return Math.max(interval, minInterval);
}

export function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}
