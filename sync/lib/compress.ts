import sharp from "sharp";

/** Longest edge in pixels for compressed output. */
export const MAX_DIMENSION = 2400;
/** JPEG quality (0-100). */
export const JPEG_QUALITY = 82;

/**
 * Compresses an arbitrary source image (JPEG/HEIC/PNG/etc.) down to a
 * single JPEG output: resized so its longest edge is at most
 * MAX_DIMENSION (never upscaled) and re-encoded at JPEG_QUALITY.
 */
export async function compressToJpeg(input: Buffer): Promise<Buffer> {
  return sharp(input, { failOn: "none" })
    .rotate() // apply EXIF orientation, then strip it
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}
