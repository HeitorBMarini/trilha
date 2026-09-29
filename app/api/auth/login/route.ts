import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { SCOPES, config, stateCookie } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cfg = config();
  if (!cfg) return NextResponse.redirect(new URL("/?erro=config", req.url));

  // O state protege o retorno contra requisições forjadas (CSRF).
  const state = randomBytes(16).toString("hex");
  const url = new URL("https://accounts.spotify.com/authorize");
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId,
    scope: SCOPES,
    redirect_uri: cfg.redirectUri,
    state,
  }).toString();

  const res = NextResponse.redirect(url);
  stateCookie(res, state);
  return res;
}
