// Cloudflare R2 client (S3-compatible).
//
// PHASE 2 — TODO once R2 is approved and provisioned:
//   1. Create the R2 bucket in the Cloudflare dashboard (e.g. "svv-temple-photos").
//   2. Create an R2 API token (Account > R2 > Manage API Tokens) scoped to that bucket.
//   3. Enable the bucket's public dev URL, or attach a custom domain
//      (e.g. img.vinaayagar.com) for serving images publicly.
//   4. Fill in the R2_* environment variables in .env.local (see .env.example).
//   5. Nothing else needs to change — getAlbumImages() in src/lib/images.ts
//      already switches from local placeholders to R2 automatically once
//      R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY are all set.
//
// Until then, this module is inert: isR2Configured() returns false and
// nothing here is called.
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET
  );
}

let client: S3Client | null = null;

/** Lazily-constructed S3 client pointed at the Cloudflare R2 S3-compatible endpoint. */
export function getR2Client(): S3Client {
  if (!isR2Configured()) {
    throw new Error(
      "R2 is not configured yet — this is expected pre-Phase-2. See src/lib/r2.ts."
    );
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

/** Lists object keys under a given album prefix, e.g. "mahotsavam-2024/". */
export async function listAlbumObjectKeys(prefix: string): Promise<string[]> {
  const s3 = getR2Client();
  const bucket = process.env.R2_BUCKET!;
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  return keys;
}

/** Public URL for an object key, via the bucket's public dev URL or custom domain. */
export function publicUrlForKey(key: string): string {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) {
    throw new Error("R2_PUBLIC_BASE_URL is not set — see .env.example.");
  }
  return `${base.replace(/\/$/, "")}/${key}`;
}
