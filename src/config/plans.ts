export const PLANS = {
  FREE: {
    name: 'Free Plan',
    slug: 'free',
    prices: {
      monthly: 0,
      yearly: 0,
    },
    // Mercado Pago plan IDs (preapproval plan templates - optional)
    mpPlanIds: {
      monthly: '',
      yearly: '',
    },
    // Legacy Stripe IDs (keep for migration)
    priceIds: {
      monthly: '',
      yearly: '',
    },
    limits: {
      endpoints: 50,
      statusPages: 1,
      checkInterval: 5,
      retention: 3,
    },
    features: {
      customDomain: false,
      emailAlerts: false,
      responseAlerts: false,
      sslMonitoring: false,
    }
  },
  SOLO: {
    name: 'Solo Plan',
    slug: 'solo',
    prices: {
      monthly: 19.90,
      yearly: 190.80,
    },
    mpPlanIds: {
      monthly: process.env.MP_PLAN_ID_SOLO_MONTHLY || '',
      yearly: process.env.MP_PLAN_ID_SOLO_YEARLY || '',
    },
    priceIds: {
      monthly: process.env.STRIPE_PRICE_ID_SOLO_MONTHLY || process.env.STRIPE_PRICE_ID_SOLO || '',
      yearly: process.env.STRIPE_PRICE_ID_SOLO_YEARLY || '',
    },
    limits: {
      endpoints: 60,
      statusPages: 2,
      checkInterval: 5,
      retention: 30,
    },
    features: {
      customDomain: false,
      emailAlerts: false,
      responseAlerts: false,
      sslMonitoring: false,
    }
  },
  PRO: {
    name: 'Pro Plan',
    slug: 'pro',
    prices: {
      monthly: 39.90,
      yearly: 382.80,
    },
    mpPlanIds: {
      monthly: process.env.MP_PLAN_ID_PRO_MONTHLY || '',
      yearly: process.env.MP_PLAN_ID_PRO_YEARLY || '',
    },
    priceIds: {
      monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || process.env.STRIPE_PRICE_ID_PRO || '',
      yearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY || '',
    },
    limits: {
      endpoints: 100,
      statusPages: 5,
      checkInterval: 5,
      retention: 90,
    },
    features: {
      customDomain: true,
      emailAlerts: false,
      responseAlerts: false,
      sslMonitoring: true,
    }
  },
  BUSINESS: {
    name: 'Business Plan',
    slug: 'business',
    prices: {
      monthly: 99.90,
      yearly: 958.80,
    },
    mpPlanIds: {
      monthly: process.env.MP_PLAN_ID_BUSINESS_MONTHLY || '',
      yearly: process.env.MP_PLAN_ID_BUSINESS_YEARLY || '',
    },
    priceIds: {
      monthly: process.env.STRIPE_PRICE_ID_BUSINESS_MONTHLY || process.env.STRIPE_PRICE_ID_BUSINESS || '',
      yearly: process.env.STRIPE_PRICE_ID_BUSINESS_YEARLY || '',
    },
    limits: {
      endpoints: Infinity,
      statusPages: Infinity,
      checkInterval: 5,
      retention: 365,
    },
    features: {
      customDomain: true,
      emailAlerts: true,
      responseAlerts: true,
      sslMonitoring: true,
    }
  }
} as const;

export type PlanType = keyof typeof PLANS;

export function getPlanByPriceId(priceId: string): PlanType | null {
  const plans = Object.entries(PLANS) as [PlanType, typeof PLANS[PlanType]][];
  for (const [key, plan] of plans) {
    if (plan.priceIds.monthly === priceId || plan.priceIds.yearly === priceId) {
      return key;
    }
  }
  return null;
}

export function getPlanBySlug(slug: string): typeof PLANS[PlanType] | null {
  const plans = Object.values(PLANS);
  return plans.find(p => p.slug === slug) || null;
}

export function getPlanKeyBySlug(slug: string): PlanType | null {
  const entry = Object.entries(PLANS).find(([, plan]) => plan.slug === slug);
  return entry ? entry[0] as PlanType : null;
}

export function getNextPlan(currentPlanSlug: string): typeof PLANS[PlanType] | null {
  const order: PlanType[] = ['FREE', 'SOLO', 'PRO', 'BUSINESS'];
  const currentKey = Object.keys(PLANS).find(key => PLANS[key as PlanType].slug === currentPlanSlug) as PlanType | undefined;
  
  if (!currentKey) return PLANS.SOLO;
  
  const currentIndex = order.indexOf(currentKey);
  if (currentIndex === -1 || currentIndex === order.length - 1) {
    return null;
  }
  
  return PLANS[order[currentIndex + 1]];
}
