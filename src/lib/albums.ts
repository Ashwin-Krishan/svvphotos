export type Album = {
  /** URL slug, e.g. /photos/mahotsavam-2024 */
  slug: string;
  /** Event name shown on the tab and album header */
  title: string;
  /** Festival/occasion this event belongs to, used to group tabs */
  event: string;
  year: number;
  description: string;
  /** How many placeholder photos to render for this album in dev/demo mode */
  photoCount: number;
};

// Mirrors the "Photos" section structure on the existing Wix site
// (vinaayagar.com) so the new gallery feels familiar to returning visitors.
export const albums: Album[] = [
  {
    slug: "mahotsavam-2024",
    title: "Mahotsavam 2024",
    event: "Mahotsavam",
    year: 2024,
    description: "Annual temple festival celebrations, 2024.",
    photoCount: 8,
  },
  {
    slug: "mahotsavam-2023",
    title: "Mahotsavam 2023",
    event: "Mahotsavam",
    year: 2023,
    description: "Annual temple festival celebrations, 2023.",
    photoCount: 8,
  },
  {
    slug: "mahotsavam-2022",
    title: "Mahotsavam 2022",
    event: "Mahotsavam",
    year: 2022,
    description: "Annual temple festival celebrations, 2022.",
    photoCount: 6,
  },
  {
    slug: "mahotsavam-2021",
    title: "Mahotsavam 2021",
    event: "Mahotsavam",
    year: 2021,
    description: "Annual temple festival celebrations, 2021.",
    photoCount: 6,
  },
  {
    slug: "navarathiri-2024",
    title: "Navarathiri 2024",
    event: "Navarathiri",
    year: 2024,
    description: "Nine nights of celebration honoring the Divine Mother.",
    photoCount: 7,
  },
  {
    slug: "sivarathiri-2023",
    title: "Sivarathiri 2023",
    event: "Sivarathiri",
    year: 2023,
    description: "Maha Sivarathiri night observances.",
    photoCount: 6,
  },
  {
    slug: "thiruvempavai-2023",
    title: "Thiruvempavai 2023",
    event: "Thiruvempavai",
    year: 2023,
    description: "Thiruvempavai hymns and observances.",
    photoCount: 6,
  },
];

export function getAlbum(slug: string): Album | undefined {
  return albums.find((a) => a.slug === slug);
}

export const defaultAlbumSlug = albums[0].slug;
