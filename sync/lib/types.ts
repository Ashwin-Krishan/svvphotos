/** A single photo discovered by a source walker (Drive or local folder). */
export type SourceFile = {
  /** Stable identifier for this exact file instance across runs (Drive file ID, or a hash for local files). */
  sourceId: string;
  /** Folder path segments from the root of the walk, not including the filename (e.g. ["Festival 2026", "Day 2"]). */
  pathSegments: string[];
  /** Original filename, e.g. "IMG_0042.JPG". */
  name: string;
  size?: number;
  modifiedTime?: string;
  /** Lazily reads the full file content. */
  read: () => Promise<Buffer>;
};

/** One walked tree: its files, plus the distinct top-level folder names seen (used for album registration). */
export type WalkResult = {
  files: SourceFile[];
  topLevelFolderNames: string[];
};

export type ManifestSource = "drive" | "local";

export type ManifestEntry = {
  source: ManifestSource;
  /**
   * Where this file actually landed: "r2" if it was really uploaded via
   * the S3-compatible client, "local" if R2 wasn't configured yet and it
   * only went to ./sync/local-output. Lets processNewFiles tell "already
   * synced for real" apart from "was only ever a local-mode placeholder"
   * — without this, flipping R2 on for the first time would leave every
   * already-manifested file permanently skipped, never actually uploaded.
   */
  destination: "r2" | "local";
  /** Folder path segments + filename, human-readable, for debugging/logging. */
  relPath: string;
  r2Key: string;
  size: number;
  modifiedTime?: string;
  syncedAt: string;
};

export type Manifest = {
  entries: Record<string, ManifestEntry>;
};
