import type { RawStats } from "./types";

export type Insights = ReturnType<typeof buildInsights>;

const GENRE_PT: Record<string, string> = {
  mpb: "MPB",
  sertanejo: "Sertanejo",
  "sertanejo universitario": "Sertanejo universitário",
  pagode: "Pagode",
  samba: "Samba",
  funk: "Funk",
  "funk carioca": "Funk carioca",
  "brazilian rock": "Rock nacional",
  "rock nacional": "Rock nacional",
  rock: "Rock",
  pop: "Pop",
  "hip hop": "Hip hop",
  rap: "Rap",
  "trap brasileiro": "Trap BR",
  indie: "Indie",
  "bossa nova": "Bossa nova",
  forro: "Forró",
  electronic: "Eletrônica",
  house: "House",
  "r&b": "R&B",
  jazz: "Jazz",
  gospel: "Gospel",
};

const pretty = (g: string) => GENRE_PT[g] ?? g.replace(/\b\w/g, (c) => c.toUpperCase());

/** Transforma as listas da API em números e rankings para a tela e para o card. */
export function buildInsights(raw: RawStats) {
  const { artists, tracks, recent } = raw;

  // Gêneros: peso maior para artistas mais bem colocados.
  const genreScore = new Map<string, number>();
  artists.forEach((a, i) => {
    const weight = artists.length - i;
    (a.genres ?? []).forEach((g) => genreScore.set(g, (genreScore.get(g) ?? 0) + weight));
  });
  const genreTotal = [...genreScore.values()].reduce((s, v) => s + v, 0);
  const genres = [...genreScore.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, score]) => ({ name: pretty(name), share: genreTotal ? score / genreTotal : 0 }));

  // Décadas pela data de lançamento dos álbuns das top músicas.
  const decadeCount = new Map<number, number>();
  tracks.forEach((t) => {
    const year = Number(t.album.release_date.slice(0, 4));
    if (year > 1900) decadeCount.set(Math.floor(year / 10) * 10, (decadeCount.get(Math.floor(year / 10) * 10) ?? 0) + 1);
  });
  const decades = [...decadeCount.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([decade, count]) => ({ label: `${String(decade).slice(2)}s`, decade, count, share: count / Math.max(1, tracks.length) }));
  const topDecade = [...decades].sort((a, b) => b.count - a.count)[0];

  // Relógio de escuta com as últimas reproduções, no fuso de quem está vendo.
  const hours = raw.hours?.length === 24 ? [...raw.hours] : Array.from({ length: 24 }, () => 0);
  if (!raw.hours) recent.forEach((r) => hours[new Date(r.played_at).getHours()]++);
  const recentCount = hours.reduce((s, v) => s + v, 0);
  const peakHour = hours.indexOf(Math.max(...hours));
  const period =
    peakHour >= 5 && peakHour < 12 ? "de manhã" : peakHour >= 12 && peakHour < 18 ? "à tarde" : peakHour >= 18 ? "à noite" : "de madrugada";

  // Curiosidades
  const minutes = Math.round(tracks.reduce((s, t) => s + t.duration_ms, 0) / 60000);
  const explicitShare = tracks.length ? tracks.filter((t) => t.explicit).length / tracks.length : 0;
  const trackArtistCount = new Map<string, number>();
  tracks.forEach((t) => t.artists.forEach((a) => trackArtistCount.set(a.name, (trackArtistCount.get(a.name) ?? 0) + 1)));
  const artistRanking = [...trackArtistCount.entries()].sort((a, b) => b[1] - a[1]);
  const [loyalName, loyalCount] = artistRanking[0] ?? ["", 0];
  // Plano B para os gêneros (que o Spotify deixou de enviar em 2026): quanto do top vem de cada artista.
  const artistShare = artistRanking
    .slice(0, 6)
    .map(([name, count]) => ({ name, share: tracks.length ? count / tracks.length : 0 }));
  const avgYear = tracks.length
    ? Math.round(tracks.reduce((s, t) => s + Number(t.album.release_date.slice(0, 4)), 0) / tracks.length)
    : null;
  const uniqueArtistsInRecent = recent.length
    ? new Set(recent.map((r) => r.track.artists[0]?.id)).size
    : new Set(tracks.flatMap((t) => t.artists.map((a) => a.name))).size;

  return {
    topArtist: artists[0],
    artists: artists.slice(0, 10),
    tracks: tracks.slice(0, 10),
    playlistUris: tracks.slice(0, 30).map((t) => t.uri),
    genres,
    artistShare,
    decades,
    topDecade,
    hours,
    peakHour,
    period,
    facts: {
      minutes,
      explicitShare,
      loyal: loyalName ? { name: loyalName, count: loyalCount } : null,
      avgYear,
      uniqueArtistsInRecent,
      recentCount,
      varietyFromRecent: recent.length > 0,
    },
  };
}

export const imageOf = (images?: { url: string }[], prefer: "large" | "small" = "large") =>
  images?.length ? (prefer === "large" ? images[0].url : images[images.length - 1].url) : undefined;
