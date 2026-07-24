// Manual overrides for an album's cover photo. Covers are normally just
// "the first R2 object key under <slug>/" (see src/lib/heroPhotos.ts),
// which is fine until someone wants a specific shot as the thumbnail —
// add an entry here (the R2 object key, not a full URL) to pin one.
export const albumCoverOverrides: Record<string, string> = {
  "festival-2026": "festival-2026/day-1-am/dsc04778.jpg",
};
