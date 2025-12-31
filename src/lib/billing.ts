import { Subscription } from "@prisma/client";

export function calculateProration(
  subscription: Subscription | null,
  newPlanPrice: number
): { credit: number; finalAmount: number; remainingDays: number; excessCredit: number } {
  if (
    !subscription ||
    subscription.status !== "active" ||
    !subscription.currentPeriodEnd ||
    !subscription.lastPaymentDate ||
    !subscription.lastPaymentAmount
  ) {
    return { credit: 0, finalAmount: newPlanPrice, remainingDays: 0, excessCredit: 0 };
  }

  const now = new Date();
  const periodEnd = new Date(subscription.currentPeriodEnd);
  
  // If expired, no credit
  if (now >= periodEnd) {
    return { credit: 0, finalAmount: newPlanPrice, remainingDays: 0, excessCredit: 0 };
  }

  const periodStart = new Date(subscription.lastPaymentDate);
  const totalDurationMs = periodEnd.getTime() - periodStart.getTime();
  const remainingDurationMs = periodEnd.getTime() - now.getTime();

  // Avoid division by zero
  if (totalDurationMs <= 0) {
    return { credit: 0, finalAmount: newPlanPrice, remainingDays: 0, excessCredit: 0 };
  }

  const unusedRatio = remainingDurationMs / totalDurationMs;
  const credit = subscription.lastPaymentAmount * unusedRatio;
  
  // Round to 2 decimals
  const roundedCredit = Math.round(credit * 100) / 100;
  
  let finalAmount = newPlanPrice - roundedCredit;
  let excessCredit = 0;

  if (finalAmount < 0) {
    excessCredit = Math.abs(finalAmount);
    finalAmount = 0;
  }
  
  finalAmount = Math.round(finalAmount * 100) / 100;
  excessCredit = Math.round(excessCredit * 100) / 100;

  const remainingDays = Math.ceil(remainingDurationMs / (1000 * 60 * 60 * 24));

  return { credit: roundedCredit, finalAmount, excessCredit, remainingDays };
}
