// Formatos mínimos das respostas da Web API do Spotify que o app usa.

export type SpotifyImage = { url: string; width: number | null; height: number | null };

export type SpotifyArtist = {
  id: string;
  name: string;
  genres?: string[];
  images?: SpotifyImage[];
  external_urls: { spotify: string };
};

export type SpotifyTrack = {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  explicit: boolean;
  artists: { id: string; name: string }[];
  album: { name: string; release_date: string; images: SpotifyImage[] };
  external_urls: { spotify: string };
};

export type RecentlyPlayed = { played_at: string; track: SpotifyTrack };

export type TimeRange = "short_term" | "medium_term" | "long_term";

export const RANGES: { id: TimeRange; label: string; long: string }[] = [
  { id: "short_term", label: "4 semanas", long: "nas últimas 4 semanas" },
  { id: "medium_term", label: "6 meses", long: "nos últimos 6 meses" },
  { id: "long_term", label: "1 ano", long: "no último ano" },
];

/** O que o servidor devolve (ou o modo demonstração monta) para a tela. */
export type RawStats = {
  user: { name: string; image?: string };
  range: TimeRange;
  artists: SpotifyArtist[];
  tracks: SpotifyTrack[];
  recent: RecentlyPlayed[];
  /** Reproduções por hora já calculadas (link compartilhado/snapshot), no lugar de `recent`. */
  hours?: number[];
};
