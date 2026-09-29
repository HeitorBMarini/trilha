import type { NextRequest, NextResponse } from "next/server";

export const SCOPES = ["user-top-read", "user-read-recently-played", "playlist-modify-private"].join(" ");

export const COOKIE = {
  access: "trilha_at",
  refresh: "trilha_rt",
  expires: "trilha_exp",
  state: "trilha_state",
} as const;

export function config() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

const secure = process.env.NODE_ENV === "production";
const base = { httpOnly: true, sameSite: "lax" as const, secure, path: "/" };

type TokenResponse = { access_token: string; expires_in: number; refresh_token?: string };

async function tokenRequest(body: Record<string, string>) {
  const cfg = config();
  if (!cfg) throw new Error("Spotify não configurado.");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Falha no token do Spotify (${res.status}).`);
  return (await res.json()) as TokenResponse;
}

export const exchangeCode = (code: string) =>
  tokenRequest({ grant_type: "authorization_code", code, redirect_uri: config()!.redirectUri });

export const refreshToken = (refresh: string) => tokenRequest({ grant_type: "refresh_token", refresh_token: refresh });

export function saveTokens(res: NextResponse, t: TokenResponse) {
  res.cookies.set(COOKIE.access, t.access_token, { ...base, maxAge: t.expires_in });
  res.cookies.set(COOKIE.expires, String(Date.now() + (t.expires_in - 60) * 1000), { ...base, maxAge: 60 * 60 * 24 * 30 });
  if (t.refresh_token) res.cookies.set(COOKIE.refresh, t.refresh_token, { ...base, maxAge: 60 * 60 * 24 * 30 });
}

export function clearTokens(res: NextResponse) {
  for (const name of Object.values(COOKIE)) res.cookies.delete(name);
}

export const stateCookie = (res: NextResponse, value: string) =>
  res.cookies.set(COOKIE.state, value, { ...base, maxAge: 600 });

/** Devolve um access token válido, renovando com o refresh token quando precisa. */
export async function getAccessToken(req: NextRequest): Promise<{ token: string; refreshed?: TokenResponse } | null> {
  const access = req.cookies.get(COOKIE.access)?.value;
  const expires = Number(req.cookies.get(COOKIE.expires)?.value ?? 0);
  if (access && Date.now() < expires) return { token: access };
  const refresh = req.cookies.get(COOKIE.refresh)?.value;
  if (!refresh) return null;
  const t = await refreshToken(refresh);
  return { token: t.access_token, refreshed: t };
}

export class SpotifyError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function spotify<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) throw new SpotifyError(res.status, `Spotify respondeu ${res.status} em ${path}`);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
