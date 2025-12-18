import { NextResponse } from "next/server"
import { PrismaClient, IncidentStatus, IncidentImpact } from "@prisma/client"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const prisma = new PrismaClient()

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const list = await prisma.incident.findMany({
    where: {
      statusPage: {
        userId: session.user.id
      }
    },
    orderBy: { startedAt: "desc" },
    select: { id: true, title: true, status: true, impact: true, startedAt: true, updatedAt: true, affectedComponents: true },
  })
  return NextResponse.json(list)
}


