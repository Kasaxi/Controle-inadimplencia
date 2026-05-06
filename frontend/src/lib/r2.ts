import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const r2 = accountId && accessKeyId && secretAccessKey 
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  : null;

export const BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
export const PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

/**
 * Generate a pre-signed URL for uploading a file to R2
 */
export async function generatePresignedUrl(
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; fileUrl: string }> {
  // Use a unique filename to prevent overwriting
  const uniqueFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: uniqueFileName,
    ContentType: contentType,
  });

  if (!r2) {
    throw new Error("Cloudflare R2 is not configured. Check environment variables.");
  }

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 }); // 1 hour expiry

  // The final URL where the file can be accessed
  const fileUrl = `${PUBLIC_URL}/${uniqueFileName}`;

  return { uploadUrl, fileUrl };
}
