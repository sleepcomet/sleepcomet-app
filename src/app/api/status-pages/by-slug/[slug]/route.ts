import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(_: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const s = slug.toLowerCase()
  const page = await prisma.statusPage.findUnique({
    where: { slug: s },
    select: {
      id: true,
      name: true,
      slug: true,
      visibility: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      endpoints: {
        select: { id: true, name: true, url: true, status: true, uptime: true, lastCheck: true }
      },
      user: {
        select: {
          subscription: {
            select: {
              plan: true
            }
          }
        }
      }
    },
  })
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const plan = page.user?.subscription?.plan || "FREE"
  let daysRetention = 3
  if (plan === "SOLO") daysRetention = 30
  if (plan === "PRO") daysRetention = 90
  if (plan === "BUSINESS") daysRetention = 365

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user, ...pageWithoutUser } = page
  return NextResponse.json({ ...pageWithoutUser, daysRetention })
}
