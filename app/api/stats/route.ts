import { NextResponse, type NextRequest } from "next/server";
import { SpotifyError, clearTokens, config, getAccessToken, saveTokens, spotify } from "@/lib/spotify";
import type { RawStats, RecentlyPlayed, SpotifyArtist, SpotifyTrack, TimeRange } from "@/lib/types";

export const dynamic = "force-dynamic";

const RANGES: TimeRange[] = ["short_term", "medium_term", "long_term"];

export async function GET(req: NextRequest) {
  if (!config()) return NextResponse.json({ error: "config" }, { status: 503 });

  const range = (req.nextUrl.searchParams.get("range") as TimeRange) || "short_term";
  if (!RANGES.includes(range)) return NextResponse.json({ error: "Período inválido." }, { status: 400 });

  let auth;
  try {
    auth = await getAccessToken(req);
  } catch {
    auth = null;
  }
  if (!auth) return NextResponse.json({ error: "login" }, { status: 401 });

  try {
    const [me, artists, tracks, recent] = await Promise.all([
      spotify<{ display_name: string | null; images?: { url: string }[] }>(auth.token, "/me"),
      spotify<{ items: SpotifyArtist[] }>(auth.token, `/me/top/artists?time_range=${range}&limit=50`),
      spotify<{ items: SpotifyTrack[] }>(auth.token, `/me/top/tracks?time_range=${range}&limit=50`),
      spotify<{ items: RecentlyPlayed[] }>(auth.token, "/me/player/recently-played?limit=50"),
    ]);

    const body: RawStats = {
      user: { name: me.display_name ?? "você", image: me.images?.[0]?.url },
      range,
      artists: artists.items,
      tracks: tracks.items,
      recent: recent.items,
    };
    const res = NextResponse.json(body);
    if (auth.refreshed) saveTokens(res, auth.refreshed);
    return res;
  } catch (e) {
    if (e instanceof SpotifyError && e.status === 401) {
      const res = NextResponse.json({ error: "login" }, { status: 401 });
      clearTokens(res);
      return res;
    }
    // 403 costuma ser conta fora da lista de usuários do app (modo de desenvolvimento, até 5 contas).
    if (e instanceof SpotifyError && e.status === 403) return NextResponse.json({ error: "sem-acesso" }, { status: 403 });
    console.error("Stats:", e);
    return NextResponse.json({ error: "Não foi possível falar com o Spotify agora." }, { status: 502 });
  }
}
