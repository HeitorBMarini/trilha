import type { RawStats, SpotifyArtist, SpotifyTrack, TimeRange } from "./types";

/**
 * Versão compacta de uma retrospectiva, usada no link compartilhável (vai no #, nunca chega ao servidor)
 * e no arquivo da demonstração. Guarda só o necessário para redesenhar a tela.
 */
type CompactArtist = [name: string, genres: string[], image: string, id: string];
type CompactTrack = [name: string, artists: string[], year: number, image: string, durationS: number, explicit: 0 | 1, id: string];

export type Snapshot = {
  v: 1;
  n: string; // nome
  r: TimeRange;
  a: CompactArtist[];
  t: CompactTrack[];
  h: number[]; // reproduções por hora do dia
};

const CDN = "https://i.scdn.co/image/";
const shortImg = (url?: string) => (url?.startsWith(CDN) ? url.slice(CDN.length) : url ?? "");
const longImg = (id: string) => (!id ? undefined : id.startsWith("http") ? id : CDN + id);
const smallest = (imgs?: { url: string }[]) => (imgs?.length ? imgs[Math.min(1, imgs.length - 1)].url : undefined);

export function toSnapshot(raw: RawStats, hours: number[]): Snapshot {
  return {
    v: 1,
    n: raw.user.name,
    r: raw.range,
    a: raw.artists.slice(0, 15).map((a) => [a.name, (a.genres ?? []).slice(0, 3), shortImg(smallest(a.images)), a.id]),
    t: raw.tracks.slice(0, 30).map((t) => [
      t.name,
      t.artists.map((x) => x.name).slice(0, 3),
      Number(t.album.release_date.slice(0, 4)),
      shortImg(smallest(t.album.images)),
      Math.round(t.duration_ms / 1000),
      t.explicit ? 1 : 0,
      t.id,
    ]),
    h: hours,
  };
}

export function fromSnapshot(s: Snapshot): RawStats {
  const artists: SpotifyArtist[] = s.a.map(([name, genres, img, id]) => ({
    id,
    name,
    genres,
    images: longImg(img) ? [{ url: longImg(img)!, width: null, height: null }] : [],
    external_urls: { spotify: id.startsWith("demo") ? "https://open.spotify.com/" : `https://open.spotify.com/artist/${id}` },
  }));
  const tracks: SpotifyTrack[] = s.t.map(([name, artistNames, year, img, dur, explicit, id]) => ({
    id,
    name,
    uri: `spotify:track:${id}`,
    duration_ms: dur * 1000,
    explicit: explicit === 1,
    artists: artistNames.map((n, i) => ({ id: `${id}-${i}`, name: n })),
    album: { name, release_date: `${year}-01-01`, images: longImg(img) ? [{ url: longImg(img)!, width: null, height: null }] : [] },
    external_urls: { spotify: `https://open.spotify.com/track/${id}` },
  }));
  return { user: { name: s.n }, range: s.r, artists, tracks, recent: [], hours: s.h };
}

// --- Compressão para caber num link ---

const toB64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64Url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

export async function encodeSnapshot(s: Snapshot) {
  const bytes = await pipe(new TextEncoder().encode(JSON.stringify(s)), new CompressionStream("deflate-raw"));
  return toB64Url(bytes);
}

export async function decodeSnapshot(code: string): Promise<Snapshot | null> {
  try {
    const bytes = await pipe(fromB64Url(code), new DecompressionStream("deflate-raw"));
    const s = JSON.parse(new TextDecoder().decode(bytes)) as Snapshot;
    return s?.v === 1 && Array.isArray(s.a) && Array.isArray(s.t) && Array.isArray(s.h) ? s : null;
  } catch {
    return null;
  }
}
