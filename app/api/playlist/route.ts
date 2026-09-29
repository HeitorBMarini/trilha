import { NextResponse, type NextRequest } from "next/server";
import { getAccessToken, saveTokens, spotify } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await getAccessToken(req).catch(() => null);
  if (!auth) return NextResponse.json({ error: "login" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { uris?: unknown; label?: unknown } | null;
  const uris = Array.isArray(body?.uris)
    ? body.uris.filter((u): u is string => typeof u === "string" && /^spotify:track:[A-Za-z0-9]+$/.test(u)).slice(0, 50)
    : [];
  if (!uris.length) return NextResponse.json({ error: "Nenhuma música válida." }, { status: 400 });
  const label = typeof body?.label === "string" ? body.label.slice(0, 40) : "";

  try {
    const playlist = await spotify<{ id: string; external_urls: { spotify: string } }>(auth.token, "/me/playlists", {
      method: "POST",
      body: JSON.stringify({
        name: `Minha trilha · ${label || "top músicas"}`,
        description: "Criada pelo Trilha com as suas músicas mais ouvidas.",
        public: false,
      }),
    });
    await spotify(auth.token, `/playlists/${playlist.id}/items`, { method: "POST", body: JSON.stringify({ uris }) });

    const res = NextResponse.json({ url: playlist.external_urls.spotify });
    if (auth.refreshed) saveTokens(res, auth.refreshed);
    return res;
  } catch (e) {
    console.error("Playlist:", e);
    return NextResponse.json({ error: "Não foi possível criar a playlist." }, { status: 502 });
  }
}
