import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { createHmac, createHash } from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

function hmac(key: Buffer | string, data: string) {
  return createHmac("sha256", key).update(data, "utf8").digest()
}

function sha256(data: string) {
  return createHash("sha256").update(data, "utf8").digest("hex")
}

function toHex(buffer: Buffer) {
  return buffer.toString("hex")
}

export async function POST(req: Request) {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { fileName, contentType } = await req.json()
  
  // Cloudflare R2 configuration
  const accountId = process.env.R2_ACCOUNT_ID || ""
  const bucket = process.env.R2_BUCKET_NAME || ""
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || ""
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || ""
  const publicUrl = process.env.R2_PUBLIC_URL || "" // Custom domain or R2.dev URL
  
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    console.error("[UPLOAD] R2 not configured. Required: R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY")
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 })
  }

  const now = new Date()
  const amzDate = now.toISOString().replace(/[-:]|\.\d{3}/g, "")
  const dateStamp = amzDate.slice(0, 8)

  // R2 uses 'auto' as region
  const region = "auto"
  const service = "s3"
  const algorithm = "AWS4-HMAC-SHA256"
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  
  // Create unique key for the file
  const fileExt = fileName.split('.').pop() || 'jpg'
  const key = `avatars/${session.user.id}-${Date.now()}.${fileExt}`
  
  // R2 endpoint format
  const host = `${accountId}.r2.cloudflarestorage.com`
  const expires = 900
  const signedHeaders = "host"

  const canonicalUri = `/${bucket}/${key}`
  
  const queryParams = new URLSearchParams({
    "X-Amz-Algorithm": algorithm,
    "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expires),
    "X-Amz-SignedHeaders": signedHeaders,
  })
  
  // Sort query parameters (required for signature)
  const sortedQuery = [...queryParams.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&")

  const canonicalHeaders = `host:${host}\n`
  const payloadHash = "UNSIGNED-PAYLOAD"
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    sortedQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join("\n")

  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    sha256(canonicalRequest)
  ].join("\n")

  const kDate = hmac(Buffer.from("AWS4" + secretAccessKey, "utf8"), dateStamp)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, service)
  const kSigning = hmac(kService, "aws4_request")
  const signature = toHex(hmac(kSigning, stringToSign))

  const uploadUrl = `https://${host}${canonicalUri}?${sortedQuery}&X-Amz-Signature=${signature}`
  
  // Public URL for accessing the file
  const fileUrl = publicUrl 
    ? `${publicUrl}/${key}`
    : `https://${bucket}.${accountId}.r2.dev/${key}`

  return NextResponse.json({ 
    uploadUrl, 
    fileUrl, 
    key, 
    contentType 
  })
}
