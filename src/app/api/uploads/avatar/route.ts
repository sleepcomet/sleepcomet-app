import { NextResponse } from "next/server"
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
  const { fileName, contentType } = await req.json()
  const bucket = process.env.AWS_S3_BUCKET || ""
  const region = process.env.AWS_S3_REGION || "us-east-1"
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || ""
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || ""
  if (!bucket || !accessKeyId || !secretAccessKey) {
    return NextResponse.json({ error: "S3 not configured" }, { status: 500 })
  }

  const now = new Date()
  const amzDate = now.toISOString().replace(/[-:]|\..*/g, "").slice(0, 15) + "Z"
  const dateStamp = amzDate.slice(0, 8)

  const service = "s3"
  const algorithm = "AWS4-HMAC-SHA256"
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const key = `avatars/${dateStamp}/${Math.random().toString(36).slice(2)}-${fileName}`
  const host = `${bucket}.s3.${region}.amazonaws.com`
  const expires = 900
  const signedHeaders = "host"

  const canonicalUri = `/${encodeURIComponent(key)}`.replace(/%2F/g, "/")
  const canonicalQuery = new URLSearchParams({
    "X-Amz-Algorithm": algorithm,
    "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expires),
    "X-Amz-SignedHeaders": signedHeaders,
  }).toString()

  const canonicalHeaders = `host:${host}\n`
  const payloadHash = sha256("")
  const canonicalRequest = [`PUT`, canonicalUri, canonicalQuery, canonicalHeaders, signedHeaders, payloadHash].join("\n")

  const stringToSign = [algorithm, amzDate, credentialScope, sha256(canonicalRequest)].join("\n")

  const kDate = hmac(Buffer.from("AWS4" + secretAccessKey, "utf8"), dateStamp)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, service)
  const kSigning = hmac(kService, "aws4_request")
  const signature = toHex(hmac(kSigning, stringToSign))

  const uploadUrl = `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`
  const fileUrl = `https://${host}/${key}`

  return NextResponse.json({ uploadUrl, fileUrl, key, contentType })
}
