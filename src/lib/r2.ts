import "server-only";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 (S3-compatible). Two buckets:
 *  - public:  product photos, served from R2_PUBLIC_BASE_URL
 *  - private: customer reference images, only reachable through short-lived signed GET URLs
 * Credentials never leave the server; browsers upload directly with presigned PUT URLs.
 */
type Bucket = "public" | "private";

let client: S3Client | null = null;

export function isR2Configured(bucket: Bucket = "public"): boolean {
  const base = !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
  return bucket === "public" ? base && !!process.env.R2_PUBLIC_BUCKET && !!process.env.R2_PUBLIC_BASE_URL : base && !!process.env.R2_PRIVATE_BUCKET;
}

function getClient(): S3Client {
  // R2_ENDPOINT is optional: point it at MinIO or another S3-compatible server for local development.
  const custom = process.env.R2_ENDPOINT;
  client ??= new S3Client({
    region: "auto",
    endpoint: custom || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: !!custom,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
  });
  return client;
}

function bucketName(bucket: Bucket): string {
  return (bucket === "public" ? process.env.R2_PUBLIC_BUCKET : process.env.R2_PRIVATE_BUCKET)!;
}

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

/** Random, unguessable object key; the original file name is never used in the key. */
export function makeObjectKey(prefix: string, contentType: string): string {
  return `${prefix}/${randomUUID()}.${EXT[contentType] ?? "bin"}`;
}

export function publicUrlFor(objectKey: string): string {
  return `${process.env.R2_PUBLIC_BASE_URL!.replace(/\/$/, "")}/${objectKey}`;
}

/** Presigned PUT. Content-Type and Content-Length are signed, so the browser can't swap in a different file. */
export function presignUpload(bucket: Bucket, objectKey: string, contentType: string, size: number, expiresIn = 300): Promise<string> {
  return getSignedUrl(
    getClient(),
    new PutObjectCommand({ Bucket: bucketName(bucket), Key: objectKey, ContentType: contentType, ContentLength: size }),
    { expiresIn, signableHeaders: new Set(["content-type", "content-length"]) },
  );
}

export function presignDownload(bucket: Bucket, objectKey: string, expiresIn = 300): Promise<string> {
  return getSignedUrl(getClient(), new GetObjectCommand({ Bucket: bucketName(bucket), Key: objectKey }), { expiresIn });
}

export async function headObject(bucket: Bucket, objectKey: string): Promise<{ size: number; contentType: string | undefined } | null> {
  try {
    const res = await getClient().send(new HeadObjectCommand({ Bucket: bucketName(bucket), Key: objectKey }));
    return { size: res.ContentLength ?? 0, contentType: res.ContentType };
  } catch {
    return null;
  }
}

export async function deleteObject(bucket: Bucket, objectKey: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: bucketName(bucket), Key: objectKey }));
}
