import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, exchangeCode, saveTokens } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const expected = req.cookies.get(COOKIE.state)?.value;
  const home = (erro?: string) => new URL(erro ? `/?erro=${erro}` : "/", req.url);

  if (params.get("error")) return NextResponse.redirect(home("negado"));
  if (!code || !state || state !== expected) return NextResponse.redirect(home("state"));

  try {
    const tokens = await exchangeCode(code);
    const res = NextResponse.redirect(home());
    saveTokens(res, tokens);
    res.cookies.delete(COOKIE.state);
    return res;
  } catch (e) {
    console.error("Callback do Spotify:", e);
    return NextResponse.redirect(home("token"));
  }
}
