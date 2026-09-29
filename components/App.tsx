"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { demoStats } from "@/lib/demo";
import { decodeSnapshot, fromSnapshot, type Snapshot } from "@/lib/snapshot";
import type { RawStats, TimeRange } from "@/lib/types";
import { Landing } from "./Landing";
import { Dashboard, DashboardSkeleton, type Mode } from "./Dashboard";

type State =
  | { kind: "loading" }
  | { kind: "landing"; reason?: string }
  | { kind: "ready"; data: RawStats; mode: Mode; realDemo?: boolean }
  | { kind: "error"; message: string };

const ERRORS: Record<string, string> = {
  negado: "Você cancelou o login no Spotify.",
  state: "O login expirou ou foi interrompido. Tente de novo.",
  token: "O Spotify não confirmou o login. Tente de novo.",
  config: "O login com Spotify ainda não está configurado neste site. Veja a demonstração.",
  "sem-acesso":
    "Sua conta ainda não está liberada. Apps em modo de desenvolvimento do Spotify aceitam só contas cadastradas pelo dono (até 5).",
  link: "Esse link de trilha está incompleto ou inválido.",
};

/** Arquivo opcional com uma retrospectiva real para a demonstração (gerado pelo botão "Exportar"). */
type DemoFile = { ranges: Partial<Record<TimeRange, Snapshot>> };
let demoFile: Promise<DemoFile | null> | null = null;
const loadDemoFile = () =>
  (demoFile ??= fetch("/demo-snapshot.json")
    .then((r) => (r.ok ? (r.json() as Promise<DemoFile>) : null))
    .catch(() => null));

export function App() {
  const params = useSearchParams();
  const router = useRouter();
  const demo = params.get("demo") === "1";
  const [range, setRange] = useState<TimeRange>("short_term");
  const [state, setState] = useState<State>({ kind: "loading" });
  const [shared, setShared] = useState<RawStats | null | undefined>(undefined);

  // Link compartilhado: os dados vêm no # da URL e nunca passam pelo servidor.
  useEffect(() => {
    const code = window.location.hash.match(/^#s=(.+)$/)?.[1];
    if (!code) return setShared(null);
    decodeSnapshot(code).then((s) => setShared(s ? fromSnapshot(s) : null));
  }, []);

  const load = useCallback(
    async (r: TimeRange) => {
      if (demo) {
        const file = await loadDemoFile();
        const snap = file?.ranges[r];
        setState(
          snap
            ? { kind: "ready", data: fromSnapshot(snap), mode: "demo", realDemo: true }
            : { kind: "ready", data: demoStats(r), mode: "demo" },
        );
        return;
      }
      setState((s) => (s.kind === "ready" ? s : { kind: "loading" }));
      try {
        const res = await fetch(`/api/stats?range=${r}`, { cache: "no-store" });
        if (res.ok) return setState({ kind: "ready", data: await res.json(), mode: "own" });
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) return setState({ kind: "landing" });
        if (res.status === 503) return setState({ kind: "landing", reason: "config" });
        if (res.status === 403) return setState({ kind: "landing", reason: "sem-acesso" });
        setState({ kind: "error", message: body.error ?? "Algo deu errado." });
      } catch {
        setState({ kind: "error", message: "Sem conexão com o servidor." });
      }
    },
    [demo],
  );

  useEffect(() => {
    if (shared === undefined) return; // ainda lendo o #
    if (shared) return setState({ kind: "ready", data: shared, mode: "shared" });
    load(range);
  }, [load, range, shared]);

  const urlError = params.get("erro");

  if (state.kind === "loading") return <DashboardSkeleton />;
  if (state.kind === "landing")
    return <Landing message={ERRORS[urlError ?? ""] ?? ERRORS[state.reason ?? ""]} loginEnabled={state.reason !== "config"} />;
  if (state.kind === "error") return <Landing message={state.message} loginEnabled />;

  return (
    <Dashboard
      data={state.data}
      mode={state.mode}
      realDemo={state.realDemo}
      range={state.mode === "shared" ? state.data.range : range}
      onRangeChange={setRange}
      onExit={() => {
        window.location.hash = "";
        router.push("/");
        if (state.mode === "shared") window.location.assign("/");
      }}
    />
  );
}
