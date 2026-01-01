import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Count incidents that are not resolved (investigating, identified, monitoring)
  const count = await prisma.incident.count({
    where: {
      statusPage: {
        userId: session.user.id
      },
      status: {
        in: ["investigating", "identified", "monitoring"]
      }
    }
  })

  return NextResponse.json({ count })
}
