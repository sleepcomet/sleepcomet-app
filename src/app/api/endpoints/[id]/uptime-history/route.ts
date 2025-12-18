import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const prisma = new PrismaClient()

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  try {
    // Get the endpoint to check user's plan
    const endpoint = await prisma.endpoint.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            subscription: {
              select: {
                plan: true
              }
            }
          }
        }
      }
    })

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint not found" }, { status: 404 })
    }

    // Determine data retention based on plan
    const plan = endpoint.user.subscription?.plan || "FREE"
    let daysToShow = 3 // Default for FREE plan

    switch (plan) {
      case "FREE":
        daysToShow = 3
        break
      case "SOLO":
        daysToShow = 30
        break
      case "PRO":
        daysToShow = 90
        break
      case "BUSINESS":
        daysToShow = 365
        break
    }

    // Calculate the date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysToShow)

    // Get all checks for this endpoint in the date range
    const checks = await prisma.$queryRaw<{ day: Date; total_checks: bigint; up_checks: bigint }[]>`
      SELECT 
        DATE(checked_at) as day,
        COUNT(*) as total_checks,
        SUM(CASE WHEN is_up THEN 1 ELSE 0 END) as up_checks
      FROM endpoint_checks
      WHERE endpoint_id = ${id}
      AND checked_at >= ${startDate}
      AND checked_at <= ${endDate}
      GROUP BY DATE(checked_at)
      ORDER BY day ASC
    `

    // Transform the data into daily uptime percentages
    const dailyData = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dayStr = currentDate.toISOString().split('T')[0]
      const checkData = checks.find(c => {
        const checkDay = new Date(c.day).toISOString().split('T')[0]
        return checkDay === dayStr
      })

      if (checkData) {
        const totalChecks = Number(checkData.total_checks)
        const upChecks = Number(checkData.up_checks)
        const uptimePercent = totalChecks > 0 ? (upChecks / totalChecks) * 100 : 100

        dailyData.push({
          date: dayStr,
          uptime: Math.round(uptimePercent * 100) / 100,
          checks: totalChecks
        })
      } else {
        // No data for this day - assume 100% (no checks = no downtime detected)
        dailyData.push({
          date: dayStr,
          uptime: 100,
          checks: 0
        })
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return NextResponse.json({
      endpointId: id,
      plan,
      daysRetention: daysToShow,
      history: dailyData
    })
  } catch (error) {
    console.error("Error fetching uptime history:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
