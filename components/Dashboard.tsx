"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, ExternalLink, ListMusic, Loader2, LogOut, Timer, Flame, CalendarRange, Users, Link2, FileDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Cover } from "./Cover";
import { ClockChart, DecadesChart, ShareChart } from "./charts";
import { buildInsights, imageOf } from "@/lib/stats";
import { renderShareCard } from "@/lib/share-card";
import { encodeSnapshot, toSnapshot } from "@/lib/snapshot";
import { RANGES, type RawStats, type TimeRange } from "@/lib/types";

export type Mode = "own" | "demo" | "shared";

type Props = {
  data: RawStats;
  mode: Mode;
  /** Demonstração com dados reais (arquivo exportado), não os fictícios. */
  realDemo?: boolean;
  range: TimeRange;
  onRangeChange: (r: TimeRange) => void;
  onExit: () => void;
};

const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export function Dashboard({ data, mode, realDemo, range, onRangeChange, onExit }: Props) {
  const demo = mode === "demo";
  const shared = mode === "shared";
  const insights = useMemo(() => buildInsights(data), [data]);
  const rangeInfo = RANGES.find((r) => r.id === range)!;
  const [sharing, setSharing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { topArtist, facts } = insights;

  const share = async () => {
    setSharing(true);
    try {
      const blob = await renderShareCard(insights, data.user.name, rangeInfo.label);
      const file = new File([blob], "minha-trilha.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Minha trilha" }).catch(() => {});
      } else {
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement("a"), { href: url, download: "minha-trilha.png" });
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Card baixado. É só postar nos stories!");
      }
    } catch {
      toast.error("Não foi possível gerar o card.");
    } finally {
      setSharing(false);
    }
  };

  const createPlaylist = async () => {
    if (demo) {
      toast.info("No modo demonstração a playlist não é criada. Entre com o Spotify para usar.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uris: insights.playlistUris, label: rangeInfo.label }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast.success("Playlist criada na sua conta!", {
        action: { label: "Abrir", onClick: () => window.open(body.url, "_blank", "noopener") },
      });
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Não foi possível criar a playlist.");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async () => {
    try {
      const code = await encodeSnapshot(toSnapshot(data, insights.hours));
      await navigator.clipboard.writeText(`${window.location.origin}/#s=${code}`);
      toast.success("Link copiado! Quem abrir vê a sua trilha sem precisar de login.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  // Baixa os 3 períodos num arquivo para virar a demonstração pública (public/demo-snapshot.json).
  const exportDemo = async () => {
    setExporting(true);
    try {
      const ranges: Record<string, unknown> = {};
      for (const r of RANGES) {
        const res = await fetch(`/api/stats?range=${r.id}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const raw = (await res.json()) as RawStats;
        ranges[r.id] = toSnapshot(raw, buildInsights(raw).hours);
      }
      const blob = new Blob([JSON.stringify({ ranges })], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement("a"), { href: url, download: "demo-snapshot.json" }).click();
      URL.revokeObjectURL(url);
      toast.success("Arquivo baixado. Ele vai em public/demo-snapshot.json para virar a demonstração.");
    } catch {
      toast.error("Não foi possível exportar agora.");
    } finally {
      setExporting(false);
    }
  };

  const greeting = shared
    ? `Esta é a trilha de ${data.user.name}`
    : demo
      ? realDemo
        ? `Demonstração com os dados reais de ${data.user.name}`
        : "Demonstração com artistas fictícios"
      : `Olá, ${data.user.name}. Esta é a sua trilha`;

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-3">
          <a href={demo ? "/?demo=1" : "/"} className="font-display text-xl font-extrabold tracking-tight">
            <span className="sunset-text">trilha</span>
          </a>
          {demo && <Badge variant="secondary">Demonstração</Badge>}
          {shared && <Badge variant="secondary">Trilha compartilhada</Badge>}
          <div className="ml-auto flex items-center gap-2">
            <Avatar className="size-8">
              {data.user.image && <AvatarImage src={data.user.image} alt="" />}
              <AvatarFallback>{initials(data.user.name)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm sm:inline">{data.user.name}</span>
            {demo || shared ? (
              <Button variant="ghost" size="sm" onClick={onExit}>
                {shared ? "Ver a minha" : "Sair da demo"}
              </Button>
            ) : (
              <form action="/api/auth/logout" method="post">
                <Tooltip>
                  <TooltipTrigger render={<Button type="submit" variant="ghost" size="icon" aria-label="Sair" />}>
                    <LogOut />
                  </TooltipTrigger>
                  <TooltipContent>Sair</TooltipContent>
                </Tooltip>
              </form>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{greeting}</p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{rangeInfo.long}</h1>
          </div>
          {shared ? (
            <Badge variant="outline" className="h-8 px-3">{rangeInfo.label}</Badge>
          ) : (
          <Tabs value={range} onValueChange={(v) => onRangeChange(v as TimeRange)}>
            <TabsList>
              {RANGES.map((r) => (
                <TabsTrigger key={r.id} value={r.id}>
                  {r.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          )}
        </div>

        {/* Destaque + ações */}
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Card className="rise relative overflow-hidden">
            <div aria-hidden className="absolute inset-0 sunset opacity-20" />
            <CardContent className="relative flex flex-col items-center gap-6 sm:flex-row">
              <Cover src={imageOf(topArtist?.images)} name={topArtist?.name ?? ""} round className="size-40 shrink-0 shadow-2xl ring-4 ring-white/10 sm:size-48" />
              <div className="text-center sm:text-left">
                <Badge className="mb-3">Artista nº 1</Badge>
                <h2 className="font-display text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">{topArtist?.name}</h2>
                {!!topArtist?.genres?.length && (
                  <p className="mt-3 text-sm capitalize text-muted-foreground">{topArtist.genres.slice(0, 3).join(" · ")}</p>
                )}
                <Button variant="link" className="mt-2 px-0" nativeButton={false} render={<a href={topArtist?.external_urls.spotify} target="_blank" rel="noopener noreferrer" />}>
                  Abrir no Spotify <ExternalLink />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rise" style={{ animationDelay: "80ms" }}>
            {shared ? (
              <>
                <CardHeader>
                  <CardTitle>Quer ver a sua?</CardTitle>
                  <CardDescription>Entre com o Spotify e gere a sua própria trilha, com card para os stories.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button size="lg" className="h-11" onClick={onExit}>
                    <Sparkles /> Ver a minha trilha
                  </Button>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>Leve a sua trilha</CardTitle>
                  <CardDescription>Gere o card para os stories, compartilhe um link ou salve as top músicas numa playlist.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button size="lg" className="h-11" onClick={share} disabled={sharing}>
                    {sharing ? <Loader2 className="animate-spin" /> : <Download />} Gerar card para os stories
                  </Button>
                  <Button size="lg" variant="outline" className="h-11" onClick={copyLink}>
                    <Link2 /> Copiar link da trilha
                  </Button>
                  <Button size="lg" variant="outline" className="h-11" onClick={createPlaylist} disabled={creating}>
                    {creating ? <Loader2 className="animate-spin" /> : <ListMusic />} Criar playlist com as top {insights.playlistUris.length}
                  </Button>
                  {mode === "own" && (
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={exportDemo} disabled={exporting}>
                      {exporting ? <Loader2 className="animate-spin" /> : <FileDown />} Exportar para a demonstração
                    </Button>
                  )}
                </CardContent>
              </>
            )}
          </Card>
        </div>

        {/* Top artistas e músicas */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rise" style={{ animationDelay: "120ms" }}>
            <CardHeader>
              <CardTitle>Top artistas</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-1">
                {insights.artists.map((a, i) => (
                  <li key={a.id}>
                    <a href={a.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted">
                      <span className="w-6 text-right font-display text-lg font-bold text-muted-foreground tabular-nums">{i + 1}</span>
                      <Cover src={imageOf(a.images, "small")} name={a.name} round className="size-10" />
                      <span className="min-w-0 flex-1 truncate font-medium">{a.name}</span>
                      {a.genres?.[0] && <span className="hidden truncate text-xs capitalize text-muted-foreground sm:inline">{a.genres[0]}</span>}
                    </a>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card className="rise" style={{ animationDelay: "160ms" }}>
            <CardHeader>
              <CardTitle>Top músicas</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-1">
                {insights.tracks.map((t, i) => (
                  <li key={t.id}>
                    <a href={t.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted">
                      <span className="w-6 text-right font-display text-lg font-bold text-muted-foreground tabular-nums">{i + 1}</span>
                      <Cover src={imageOf(t.album.images, "small")} name={t.album.name} className="size-10" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{t.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{t.artists.map((a) => a.name).join(", ")}</span>
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">{t.album.release_date.slice(0, 4)}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rise" style={{ animationDelay: "200ms" }}>
            {insights.genres.length ? (
              <>
                <CardHeader>
                  <CardTitle>Gêneros</CardTitle>
                  <CardDescription>{insights.genres[0].name} lidera entre os seus artistas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ShareChart items={insights.genres} unit="dos seus artistas" />
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>Quem domina o seu top</CardTitle>
                  <CardDescription>
                    {insights.artistShare[0]
                      ? `${insights.artistShare[0].name} está em ${Math.round(insights.artistShare[0].share * 100)}% das suas top ${insights.playlistUris.length}`
                      : "Artistas nas suas top músicas"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ShareChart items={insights.artistShare} unit={`das suas top ${insights.playlistUris.length}`} />
                </CardContent>
              </>
            )}
          </Card>

          <Card className="rise" style={{ animationDelay: "240ms" }}>
            <CardHeader>
              <CardTitle>Décadas</CardTitle>
              <CardDescription>
                {insights.topDecade ? `Seu som é dos anos ${insights.topDecade.label}` : "Lançamento das suas top músicas"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DecadesChart decades={insights.decades} />
            </CardContent>
          </Card>

          <Card className="rise" style={{ animationDelay: "280ms" }}>
            <CardHeader>
              <CardTitle>Relógio de escuta</CardTitle>
              <CardDescription>
                {facts.recentCount ? `Você ouve mais ${insights.period}, por volta das ${insights.peakHour}h` : "Sem reproduções recentes"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClockChart hours={insights.hours} />
              <p className="text-center text-xs text-muted-foreground">Com base nas suas últimas {facts.recentCount} reproduções</p>
            </CardContent>
          </Card>
        </div>

        {/* Curiosidades */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Timer, label: "Duração das top músicas", value: `${facts.minutes} min`, hint: "tocando tudo em sequência" },
            { icon: CalendarRange, label: "Ano médio", value: facts.avgYear ? String(facts.avgYear) : "–", hint: "lançamento das suas favoritas" },
            { icon: Flame, label: "Mais fiel", value: facts.loyal?.name ?? "–", hint: facts.loyal ? `${facts.loyal.count} músicas no seu top` : "" },
            {
              icon: Users,
              label: facts.varietyFromRecent ? "Variedade recente" : "Variedade no top",
              value: `${facts.uniqueArtistsInRecent} artistas`,
              hint: facts.varietyFromRecent ? `em ${facts.recentCount} reproduções` : `nas suas top ${insights.playlistUris.length} músicas`,
            },
          ].map((f, i) => (
            <Card key={f.label} size="sm" className="rise" style={{ animationDelay: `${320 + i * 40}ms` }}>
              <CardContent>
                <f.icon className="mb-2 size-4 text-sun-3" />
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <p className="truncate font-display text-2xl font-bold">{f.value}</p>
                <p className="text-xs text-muted-foreground">{f.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />
        <p className="pb-6 text-center text-xs text-muted-foreground">
          Dados fornecidos pelo Spotify. {demo && !realDemo ? "Na demonstração, artistas e músicas são fictícios." : "Nada é salvo nos nossos servidores."}
        </p>
      </main>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-5 py-20">
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-60" />
        <Skeleton className="h-60" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
