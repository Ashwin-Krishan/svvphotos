// Manual overrides for an album's cover photo. Covers are normally just
// "the first R2 object key under <slug>/" (see src/lib/heroPhotos.ts),
// which is fine until someone wants a specific shot as the thumbnail —
// add an entry here to pin one.
//
// Value is "<subfolder path>/<original filename>" (NOT the full R2 key)
// — deliberately excludes the sync pipeline's sortable-timestamp prefix
// (e.g. "20260712100106-"), since that prefix is derived and can change
// whenever photos get re-keyed (it already has once, which silently
// broke a hardcoded-key version of this override). getAlbumCoverPhoto()
// matches by filename suffix, so this keeps working across re-keys.
export const albumCoverOverrides: Record<string, string> = {
  "festival-2026": "day-1-am/dsc04778.jpg",
};
