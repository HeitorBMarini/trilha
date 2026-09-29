import { NextResponse } from "next/server";
import { clearTokens } from "@/lib/spotify";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  clearTokens(res);
  return res;
}
