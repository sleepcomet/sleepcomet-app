import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// CORS headers for cross-origin requests from LP
const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3001",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: {
        plan: true,
        interval: true,
        status: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    });

    if (!subscription) {
       // Return valid response but null subscription indicating free
       return NextResponse.json({ subscription: null }, { headers: corsHeaders });
    }

    return NextResponse.json({ subscription }, { headers: corsHeaders });

  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
