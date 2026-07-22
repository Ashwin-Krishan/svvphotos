import "dotenv/config";
import { google } from "googleapis";

function driveClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON!;
  const json = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
  const credentials = JSON.parse(json);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  return google.drive({ version: "v3", auth });
}

async function listChildren(drive: ReturnType<typeof driveClient>, folderId: string) {
  const results: import("googleapis").drive_v3.Schema$File[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType)",
      pageSize: 1000,
      pageToken,
    });
    results.push(...(res.data.files ?? []));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);
  return results;
}

async function countFilesRecursive(drive: ReturnType<typeof driveClient>, folderId: string): Promise<number> {
  const children = await listChildren(drive, folderId);
  let count = 0;
  for (const c of children) {
    if (c.mimeType === "application/vnd.google-apps.folder" && c.id) {
      count += await countFilesRecursive(drive, c.id);
    } else if (c.mimeType?.startsWith("image/")) {
      count += 1;
    }
  }
  return count;
}

async function main() {
  const drive = driveClient();
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!;

  const topLevel = await listChildren(drive, rootId);
  const festival2026 = topLevel.find((f) => f.name === "Festival 2026");
  if (!festival2026?.id) {
    console.log("Festival 2026 folder not found!");
    return;
  }

  const children = await listChildren(drive, festival2026.id);
  console.log("Festival 2026 direct children:");
  for (const f of children) {
    console.log(`  ${f.mimeType === "application/vnd.google-apps.folder" ? "[folder]" : "[file]  "} ${f.name}`);
  }

  const day8ish = children.filter((f) => f.name && /\b8\b|day\s*0?8/i.test(f.name));
  console.log("\nDay 8 matches:", day8ish.map((f) => f.name));

  // Count photos under each Day 6 folder specifically
  const day6Folders = children.filter((f) => f.name && /day\s*0?6/i.test(f.name) && f.mimeType === "application/vnd.google-apps.folder");
  console.log("\nDay 6 folders found:", day6Folders.map((f) => f.name));
  for (const f of day6Folders) {
    if (!f.id) continue;
    const count = await countFilesRecursive(drive, f.id);
    console.log(`  ${f.name}: ${count} photo(s) currently in Drive`);
  }

  if (day8ish.length > 0) {
    for (const f of day8ish) {
      if (!f.id) continue;
      if (f.mimeType === "application/vnd.google-apps.folder") {
        const count = await countFilesRecursive(drive, f.id);
        console.log(`\n${f.name}: ${count} photo(s) currently in Drive`);
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
