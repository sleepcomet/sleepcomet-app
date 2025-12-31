import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, image: true },
  })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const name = typeof body.name === "string" ? body.name.trim() : undefined
  const image = typeof body.image === "string" ? body.image.trim() : undefined
  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(image !== undefined ? { image } : {}),
    },
    select: { id: true, email: true, name: true, image: true },
  })
  return NextResponse.json(updated)
}
