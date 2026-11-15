import type { WalkResult } from "./types";

/**
 * Standardises the folder names the temple types into Drive, so the site
 * shows tidy, consistently spelled album names no matter how a folder was
 * named ("varalakshmi vratham 2026 (1)", "2026 KANDA SHASTI photos",
 * "DAY 8PM" ...). Drive itself is never renamed — this only changes how
 * the names are used for album titles, URLs and R2 keys.
 *
 * Safe by construction for existing albums: every rule either only changes
 * letter case (which never changes a URL slug) or maps to the spelling the
 * album already uses.
 */

/**
 * Canonical event names (no year), each with other spellings people use.
 * Spelling variants of the canonical name itself (Varalakshmi/Varaluxumi,
 * Kanthashasti/Kandha Sashti, extra h's, swapped vowels, d/t, b/p ...)
 * are caught automatically by `skeleton()`; `aliases` is only needed for
 * genuinely different words. Add new festivals here.
 */
const CANONICAL_EVENTS: { name: string; aliases?: string[] }[] = [
  { name: "Varaluxumi Viratham", aliases: ["Varaluxumi", "Varalakshmi Vratham", "Varalakshmi", "Varalaxmi Vrat"] },
  { name: "Kandha Sashti", aliases: ["Skanda Shashti", "Kanthashasti Viratha Utsavam", "Soorasamharam", "Sura Samharam"] },
  { name: "Kumba Abishekam", aliases: ["Maha Kumbabishekam", "Kumbabishekam"] },
  { name: "Kethara Gowri Viratham", aliases: ["Kethara Gowri", "Kedara Gauri Vratham", "Kedara Gowri"] },
  { name: "Maha Sivarathiri", aliases: ["Sivarathiri", "Maha Shivaratri", "Shivaratri"] },
  { name: "Vinaayagar Chathurthi", aliases: ["Vinayaka Chaturthi", "Ganesh Chaturthi", "Ganesha Chaturthi"] },
  { name: "Mahotsavam", aliases: ["Maha Utsavam"] },
  { name: "Ambal Festival", aliases: ["Ambal Thiruvizha", "Ambal Utsavam"] },
  { name: "Navarathiri", aliases: ["Navaratri"] },
  { name: "Thai Pongal", aliases: ["Pongal"] },
  { name: "Thiruvempavai" },
  { name: "Deepavali", aliases: ["Diwali"] },
  { name: "Boat Festival", aliases: ["Theppa Thiruvizha", "Theppam"] },
  { name: "Manjam" },
  { name: "Festival" },
];

/**
 * A spelling-insensitive fingerprint for Tamil names written in English:
 * lowercase consonants only, aspirate h's dropped (th→t, sh→s, bh→b),
 * voiced/unvoiced pairs merged (d→t, b→p, g→k), x→ks, w/y dropped, and
 * doubled letters collapsed. "Varaluxumi Viratham" and "Varalakshmi
 * Vratham" both become "vrlksmvrtm".
 */
export function skeleton(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z]/g, "")
    .replace(/x/g, "ks")
    .replace(/[aeiouhwy]/g, "")
    .replace(/d/g, "t")
    .replace(/b/g, "p")
    .replace(/g/g, "k")
    .replace(/(.)\1+/g, "$1");
}

const EVENT_BY_SKELETON = new Map<string, string>();
for (const { name, aliases = [] } of CANONICAL_EVENTS) {
  for (const spelling of [name, ...aliases]) {
    const key = skeleton(spelling);
    const existing = EVENT_BY_SKELETON.get(key);
    if (existing && existing !== name) {
      throw new Error(`Album name list: "${spelling}" is ambiguous between ${existing} and ${name}`);
    }
    EVENT_BY_SKELETON.set(key, name);
  }
}

/** Filler people add to folder names that never belongs in an album title. */
const JUNK =
  /\((?:\d+|copy)\)|\bcopy of\b|\bcopy\b|\bphotos?\b|\bpictures?\b|\bpics\b|\bimages\b|\bedited\b|\bfinal\b/gi;

const SMALL_WORDS = new Set(["and", "of", "the", "for", "in", "at", "on", "to"]);

function tidySpacing(name: string): string {
  return name
    .normalize("NFC")
    .replace(/[_.]+/g, " ")
    .replace(/\s*-+\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(text: string): string {
  return text
    .split(" ")
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (lower === "am" || lower === "pm") return lower.toUpperCase();
      if (i > 0 && SMALL_WORDS.has(lower)) return lower;
      // Leave deliberate mixed case alone (e.g. "McDonald"), but fix
      // ALL CAPS and all-lowercase words.
      if (word !== word.toUpperCase() && word !== lower) return word;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/**
 * Top-level Drive folder → album title, e.g.
 *   "  2026 varalakshmi vratham photos (1)" → "Varaluxumi Viratham 2026"
 *   "KANDA SHASTI 2026"                       → "Kandha Sashti 2026"
 * Unknown events are just tidied: spacing, capitals, junk words removed,
 * and a year anywhere in the name moved to the end.
 */
export function standardizeAlbumName(folderName: string): string {
  let text = tidySpacing(folderName).replace(JUNK, " ");
  const yearMatch = text.match(/\b(?:19|20)\d{2}\b/);
  const year = yearMatch?.[0] ?? "";
  if (year) text = text.replace(yearMatch![0], " ");
  text = text.replace(/[^\p{L}\p{N}&' ]+/gu, " ").replace(/\s+/g, " ").trim();

  if (!text) return tidySpacing(folderName) || folderName; // nothing but a year/junk — leave it be

  const event = EVENT_BY_SKELETON.get(skeleton(text)) ?? titleCase(text);
  return year ? `${event} ${year}` : event;
}

/**
 * Sub-folder (any depth below the album) → standard name. Mostly the day
 * folders: "DAY 8PM", "day 08 pm", "Day 3 Morning" → "Day 8 PM" /
 * "Day 3 AM", so the same day never splits into two sub-albums. Other
 * names only get spacing/junk cleanup and capitals.
 */
export function standardizeSubfolderName(folderName: string): string {
  const text = tidySpacing(folderName).replace(/\((?:\d+|copy)\)|\bcopy\b/gi, " ").replace(/\s+/g, " ").trim();
  if (!text) return folderName.trim() || folderName;

  const day = text.match(/^day\s*0*(\d+)\s*(am|pm|morning|evening|night)?$/i);
  if (day) {
    const part = day[2]?.toLowerCase();
    const half = !part ? "" : part === "am" || part === "morning" ? " AM" : " PM";
    return `Day ${day[1]}${half}`;
  }
  return titleCase(text);
}

/** Applies the standard names to a walked tree before anything else sees it. */
export function standardizeWalk(walk: WalkResult): WalkResult {
  const files = walk.files.map((file) => ({
    ...file,
    pathSegments: file.pathSegments.map((segment, depth) =>
      depth === 0 ? standardizeAlbumName(segment) : standardizeSubfolderName(segment)
    ),
  }));
  const topLevelFolderNames = [...new Set(walk.topLevelFolderNames.map(standardizeAlbumName))];
  return { files, topLevelFolderNames };
}
