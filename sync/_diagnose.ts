import "dotenv/config";
import { google } from "googleapis";
import { putObject } from "../src/lib/r2";

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
      fields: "nextPageToken, files(id, name, mimeType, size)",
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
  const festival2026 = topLevel.find((f) => f.name === "Festival 2026");
  if (!festival2026?.id) throw new Error("Festival 2026 not found");

  const children = await listChildren(drive, festival2026.id);
  const day11pm = children.find((f) => f.name && /day\s*11\s*pm/i.test(f.name));
  if (!day11pm?.id) {
    console.log(
      "Day 11 PM not found. Available folders:",
      children.map((f) => f.name)
    );
    return;
  }

  const files = await listChildren(drive, day11pm.id);
  const target = files.find((f) => f.name && /adk0*1178/i.test(f.name));
  if (!target?.id) {
    console.log(
      `Target file not found in ${day11pm.name}. Sample names:`,
      files.slice(0, 10).map((f) => f.name)
    );
    return;
  }

  console.log(`Found: ${target.name}, size: ${((Number(target.size) || 0) / 1024 / 1024).toFixed(2)} MB`);

  const res = await drive.files.get({ fileId: target.id, alt: "media" }, { responseType: "arraybuffer" });
  const buf = Buffer.from(res.data as ArrayBuffer);
  console.log(`Downloaded original from Drive: ${(buf.length / 1024 / 1024).toFixed(2)} MB`);

  // Route through R2 temporarily so it can be pulled back down locally —
  // this runs in Actions (has Drive creds), not locally.
  await putObject("_diagnose/original-adk01178.jpg", buf, "image/jpeg");
  console.log("Uploaded to R2 at _diagnose/original-adk01178.jpg (temporary, will be deleted after inspection)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
