import { AudioLines, Clock3, Disc3, Sparkles, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  { icon: Disc3, title: "Top artistas e músicas", text: "Em 4 semanas, 6 meses ou 1 ano." },
  { icon: AudioLines, title: "Gêneros e décadas", text: "O que forma o seu gosto." },
  { icon: Clock3, title: "Relógio de escuta", text: "Em que horário você mais ouve." },
  { icon: Share2, title: "Card para os stories", text: "Baixe e compartilhe em um clique." },
];

export function Landing({ message, loginEnabled }: { message?: string; loginEnabled: boolean }) {
  return (
    <main className="relative min-h-svh overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full sunset opacity-25 blur-[120px]" />

      <div className="relative mx-auto flex min-h-svh max-w-5xl flex-col justify-center px-5 py-16">
        <p className="rise mb-6 inline-flex w-fit items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Sparkles className="size-3.5 text-sun-3" /> Sua retrospectiva, em qualquer época do ano
        </p>
        <h1 className="rise font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl" style={{ animationDelay: "80ms" }}>
          Sua trilha sonora,
          <br />
          <span className="sunset-text">em números.</span>
        </h1>
        <p className="rise mt-6 max-w-xl text-lg text-muted-foreground" style={{ animationDelay: "160ms" }}>
          Conecte o Spotify e veja seus artistas e músicas favoritos, os gêneros que mais aparecem, as décadas que você
          ouve e o seu horário de escuta. No fim, gere um card pronto para os stories.
        </p>

        {message && (
          <Alert className="rise mt-6 max-w-xl">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
          {loginEnabled && (
            <Button size="lg" className="h-12 px-6 text-base" nativeButton={false} render={<a href="/api/auth/login" />}>
              Entrar com Spotify
            </Button>
          )}
          <Button size="lg" variant="outline" className="h-12 px-6 text-base" nativeButton={false} render={<a href="/?demo=1" />}>
            Ver demonstração
          </Button>
        </div>
        <p className="rise mt-3 text-xs text-muted-foreground" style={{ animationDelay: "300ms" }}>
          O Spotify libera o login só para contas cadastradas neste app (limite do modo de desenvolvimento). A demonstração
          mostra a trilha real do Heitor, criador do projeto.
        </p>

        <div className="rise mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" style={{ animationDelay: "380ms" }}>
          {FEATURES.map((f) => (
            <Card key={f.title} size="sm" className="bg-card/70 backdrop-blur">
              <CardContent>
                <f.icon className="mb-3 size-5 text-sun-2" />
                <p className="font-medium">{f.title}</p>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
