import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { PLANS, PlanType, getPlanKeyBySlug } from "@/config/plans";
import { calculateProration } from "@/lib/billing";

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3001",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { planId, interval = "monthly" } = body;

    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400, headers: corsHeaders });
    }

    const planKey = getPlanKeyBySlug(planId) || (planId.toUpperCase() as PlanType);
    const selectedPlan = PLANS[planKey];

    if (!selectedPlan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400, headers: corsHeaders });
    }

    // Determine new price
    // Note: If user is "SOLO" and wants "SOLO" (switching interval), we use the new interval price.
    const newPrice = interval === "yearly" ? selectedPlan.prices.yearly : selectedPlan.prices.monthly;

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    const { credit, finalAmount, remainingDays, excessCredit } = calculateProration(subscription, newPrice);

    return NextResponse.json({
      plan: selectedPlan.name,
      interval,
      originalPrice: newPrice,
      credit,
      finalAmount,
      remainingDays,
      excessCredit
    }, { headers: corsHeaders });

  } catch (error) {
    console.error("Proration error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500, headers: corsHeaders });
  }
}
