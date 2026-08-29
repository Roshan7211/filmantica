/** Canonical movie record. Field names match the project plan's Firestore schema
 *  so the JSON store can be swapped for Firestore without touching the UI. */
export type Movie = {
  id: string;
  title: string;
  slug: string;
  description: string;
  year: number | null;
  duration: number | null; // seconds
  language: string | null;
  director: string | null;
  cast: string[];
  genres: string[];
  posterUrl: string | null;
  backdropUrl: string | null;

  // Provenance — never hard-code around a single provider.
  source: string; // "internetarchive" | "filmmaker" | ...
  sourceId: string;
  sourceUrl: string;
  videoUrl: string | null;
  downloadUrl: string | null;

  // Rights. Nothing is served publicly unless these check out.
  license: string;
  licenseUrl: string | null;
  licenseVerified: boolean;
  creator: string | null;
  attributionText: string | null;

  /** "pending" records are imported but never served — they await a human decision. */
  reviewStatus: "approved" | "pending" | "rejected";
  isPublic: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ImportJob = {
  id: string;
  source: string;
  query: string;
  startedAt: string;
  completedAt: string | null;
  found: number;
  imported: number;
  rejected: number;
  duplicates: number;
  errors: string[];
  status: "running" | "complete" | "failed";
};
