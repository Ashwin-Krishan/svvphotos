import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp, { type Sharp } from "sharp";
import { ExifTool } from "exiftool-vendored";

/** Longest edge in pixels for compressed output. */
export const MAX_DIMENSION = 2400;
/** JPEG quality (0-100). */
export const JPEG_QUALITY = 82;

/**
 * Camera RAW formats. sharp/libvips can't decode these (CR2 looks like a
 * TIFF to it and fails with "Old-style JPEG compression support is not
 * configured"), so for these we pull out the full-size JPEG the camera
 * embeds in every RAW file and compress that instead. It's the camera's
 * own processed rendering, so colours match what the photographer saw.
 */
const RAW_EXTENSIONS = new Set([
  ".cr2", ".cr3", ".crw", ".nef", ".nrw", ".arw", ".srf", ".sr2",
  ".dng", ".raf", ".orf", ".rw2", ".pef", ".srw", ".x3f",
]);

export function isRawFile(fileName: string): boolean {
  return RAW_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

let exiftool: ExifTool | null = null;
function getExiftool(): ExifTool {
  exiftool ??= new ExifTool({ taskTimeoutMillis: 60_000 });
  return exiftool;
}

/** Stops the exiftool helper process so the sync can exit. Safe to call if it never started. */
export async function closeRawDecoder(): Promise<void> {
  if (exiftool) await exiftool.end();
  exiftool = null;
}

/** EXIF orientation → clockwise rotation; embedded previews don't carry the RAW's orientation tag. */
const ORIENTATION_DEGREES: Record<number, number> = { 3: 180, 6: 90, 8: 270 };

async function extractEmbeddedJpeg(
  input: Buffer,
  fileName: string
): Promise<{ jpeg: Buffer; rotate: number }> {
  const dir = await mkdtemp(path.join(tmpdir(), "svv-raw-"));
  try {
    const src = path.join(dir, `source${path.extname(fileName).toLowerCase()}`);
    await writeFile(src, input);
    const et = getExiftool();

    // Prefer the full-size JpgFromRaw (CR2, NEF, ...), then the largest
    // preview (CR3, ARW, DNG). Keep whichever comes out biggest.
    const extractors = [
      (out: string) => et.extractJpgFromRaw(src, out),
      (out: string) => et.extractPreview(src, out),
    ];
    let best: Buffer | null = null;
    for (const [i, extract] of extractors.entries()) {
      const out = path.join(dir, `embedded-${i}.jpg`);
      try {
        await extract(out);
        const buf = await readFile(out);
        if (!best || buf.length > best.length) best = buf;
      } catch {
        // This format doesn't carry that particular embedded image.
      }
    }
    if (!best) throw new Error("RAW file has no embedded JPEG to use");

    const tags = await et.read(src, { readArgs: ["-n"] });
    const orientation = Number(tags.Orientation);
    return { jpeg: best, rotate: ORIENTATION_DEGREES[orientation] ?? 0 };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * Compresses an arbitrary source image (JPEG/HEIC/PNG/camera RAW) down to
 * a single JPEG output: resized so its longest edge is at most
 * MAX_DIMENSION (never upscaled) and re-encoded at JPEG_QUALITY.
 */
export async function compressToJpeg(input: Buffer, fileName = ""): Promise<Buffer> {
  let pipeline: Sharp;
  if (isRawFile(fileName)) {
    const { jpeg, rotate } = await extractEmbeddedJpeg(input, fileName);
    pipeline = sharp(jpeg, { failOn: "none" }).rotate(rotate);
  } else {
    pipeline = sharp(input, { failOn: "none" }).rotate(); // apply EXIF orientation, then strip it
  }
  return pipeline
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}
