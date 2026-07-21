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

async function listChildren(drive: ReturnType<typeof driveClient>, folderId: string, trashed = false) {
  const results: import("googleapis").drive_v3.Schema$File[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = ${trashed}`,
      fields: "nextPageToken, files(id, name, mimeType, size, modifiedTime, trashed)",
      pageSize: 1000,
      pageToken,
    });
    results.push(...(res.data.files ?? []));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);
  return results;
}

async function main() {
  const drive = driveClient();
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!;

  const topLevel = await listChildren(drive, rootId);
  console.log(
    "Top-level folders in inbox:",
    topLevel.map((f) => f.name)
  );

  const festival2026 = topLevel.find((f) => f.name === "Festival 2026");
  if (!festival2026?.id) {
    console.log("Festival 2026 folder not found at top level!");
    return;
  }

  const children = await listChildren(drive, festival2026.id);
  console.log("\nFestival 2026 direct children (folders + loose files):");
  for (const f of children) {
    console.log(`  ${f.mimeType === "application/vnd.google-apps.folder" ? "[folder]" : "[file]  "} ${f.name}`);
  }

  const day8ish = children.filter((f) => f.name && /\b8\b|day\s*0?8/i.test(f.name));
  console.log(
    "\nAnything matching a 'day 8' pattern:",
    day8ish.map((f) => f.name)
  );

  // Check trash directly under the same parent — trashed items a service
  // account can still see are usually only ones IT trashed, but worth
  // checking in case anything shows up.
  const trashedChildren = await listChildren(drive, festival2026.id, true);
  console.log(
    "\nTrashed items directly under Festival 2026 (visible to service account):",
    trashedChildren.map((f) => f.name)
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
