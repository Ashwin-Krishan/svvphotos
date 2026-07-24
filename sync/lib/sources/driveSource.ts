import { google, drive_v3 } from "googleapis";
import type { SourceFile, WalkResult } from "../types";
import { toSortableTimestamp } from "../slug";

const FOLDER_MIME = "application/vnd.google-apps.folder";

function driveClient(): drive_v3.Drive {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set — see .env.example.");
  }
  // Accept either raw JSON or base64-encoded JSON (base64 is handy for
  // pasting a multi-line key into a single-line GitHub Actions secret).
  const json = raw.trim().startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf-8");
  const credentials = JSON.parse(json);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  return google.drive({ version: "v3", auth });
}

async function listChildren(
  drive: drive_v3.Drive,
  folderId: string
): Promise<drive_v3.Schema$File[]> {
  const results: drive_v3.Schema$File[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        "nextPageToken, files(id, name, mimeType, size, modifiedTime, imageMediaMetadata(time))",
      pageSize: 1000,
      pageToken,
    });
    results.push(...(res.data.files ?? []));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);
  return results;
}

/**
 * Recursively walks the Drive inbox folder tree (arbitrary depth),
 * mirroring nested subfolders into pathSegments exactly the way they
 * should land in R2 / on the site.
 */
export async function walkDriveFolder(rootFolderId: string): Promise<WalkResult> {
  const drive = driveClient();
  const files: SourceFile[] = [];
  const topLevelFolderNames: string[] = [];

  async function walk(folderId: string, pathSegments: string[], depth: number): Promise<void> {
    const children = await listChildren(drive, folderId);
    for (const child of children) {
      if (!child.id || !child.name) continue;

      if (child.mimeType === FOLDER_MIME) {
        if (depth === 0) topLevelFolderNames.push(child.name);
        await walk(child.id, [...pathSegments, child.name], depth + 1);
        continue;
      }

      if (!child.mimeType?.startsWith("image/")) continue;

      const fileId = child.id;
      files.push({
        sourceId: fileId,
        pathSegments,
        name: child.name,
        size: child.size ? Number(child.size) : undefined,
        modifiedTime: child.modifiedTime ?? undefined,
        capturedAt: toSortableTimestamp(
          child.imageMediaMetadata?.time ?? undefined,
          child.modifiedTime ?? undefined
        ),
        read: async () => {
          const res = await drive.files.get(
            { fileId, alt: "media" },
            { responseType: "arraybuffer" }
          );
          return Buffer.from(res.data as ArrayBuffer);
        },
      });
    }
  }

  await walk(rootFolderId, [], 0);

  return { files, topLevelFolderNames };
}
