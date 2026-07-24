import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { SourceFile, WalkResult } from "../types";
import { toSortableTimestamp } from "../slug";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"]);

function sourceIdFor(rootLabel: string, relativePath: string, size: number): string {
  return (
    "local:" +
    createHash("sha1").update(`${rootLabel}:${relativePath}:${size}`).digest("hex")
  );
}

/**
 * Recursively walks a local directory (e.g. an SD card dump), mirroring
 * its folder structure the same way driveSource does for a Drive tree.
 * `rootLabel` becomes the top-level album/folder name (defaults to the
 * root directory's own basename), so nested subfolders become nested
 * sub-album path segments exactly as they would coming from Drive.
 */
export async function walkLocalFolder(
  rootDir: string,
  rootLabel: string = path.basename(rootDir)
): Promise<WalkResult> {
  const files: SourceFile[] = [];

  async function walk(dir: string, pathSegments: string[]): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, [...pathSegments, entry.name]);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) continue;

      const info = await stat(fullPath);
      const relativePath = path.relative(rootDir, fullPath);
      files.push({
        sourceId: sourceIdFor(rootLabel, relativePath, info.size),
        pathSegments,
        name: entry.name,
        size: info.size,
        modifiedTime: info.mtime.toISOString(),
        capturedAt: toSortableTimestamp(undefined, info.mtime.toISOString()),
        read: () => readFile(fullPath),
      });
    }
  }

  await walk(rootDir, [rootLabel]);

  return { files, topLevelFolderNames: [rootLabel] };
}
