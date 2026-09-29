import type { Insights } from "./stats";
import { imageOf } from "./stats";

const W = 1080;
const H = 1920;

function loadImage(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // as imagens do Spotify permitem CORS; se falhar, o card sai sem foto
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function fit(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

function hue(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return 95 + (h % 95); // tons de verde a azul-esverdeado, no tema do app
}

/** Desenha o card no formato de story e devolve um PNG. */
export async function renderShareCard(insights: Insights, userName: string, rangeLabel: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  await document.fonts.ready;
  const display = getComputedStyle(document.body).getPropertyValue("--font-bricolage").trim() || "sans-serif";
  const sans = getComputedStyle(document.body).getPropertyValue("--font-inter").trim() || "sans-serif";

  // Fundo com brilhos de pôr do sol
  ctx.fillStyle = "#0b0b0b";
  ctx.fillRect(0, 0, W, H);
  const glow = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
  glow(180, 220, 700, "rgba(31,223,100,0.35)");
  glow(980, 700, 650, "rgba(15,159,79,0.35)");
  glow(300, 1800, 700, "rgba(180,245,168,0.18)");

  // Cabeçalho
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `600 34px ${sans}`;
  ctx.fillText(`MINHA TRILHA · ${rangeLabel.toUpperCase()}`, 80, 130);
  ctx.fillStyle = "#fff";
  ctx.font = `700 64px ${display}`;
  ctx.fillText(fit(ctx, userName, W - 160), 80, 210);

  // Artista nº 1
  const top = insights.topArtist;
  const photo = await loadImage(imageOf(top?.images));
  const cx = W / 2, cy = 560, r = 230;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  if (photo) {
    const s = Math.max((2 * r) / photo.width, (2 * r) / photo.height);
    ctx.drawImage(photo, cx - (photo.width * s) / 2, cy - (photo.height * s) / 2, photo.width * s, photo.height * s);
  } else {
    const h = hue(top?.name ?? "");
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, `hsl(${h} 70% 55%)`);
    g.addColorStop(1, `hsl(${(h + 50) % 360} 75% 40%)`);
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    const initials = (top?.name ?? "")
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `800 170px ${display}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, cx, cy + 6);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `600 36px ${sans}`;
  ctx.fillText("ARTISTA Nº 1", cx, cy + r + 90);
  ctx.fillStyle = "#fff";
  ctx.font = `800 84px ${display}`;
  ctx.fillText(fit(ctx, top?.name ?? "", W - 160), cx, cy + r + 185);
  ctx.textAlign = "left";

  // Listas
  const list = (title: string, items: string[], x: number, y: number, width: number) => {
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = `600 32px ${sans}`;
    ctx.fillText(title, x, y);
    items.slice(0, 5).forEach((name, i) => {
      const yy = y + 78 + i * 74;
      ctx.fillStyle = "#1fdf64";
      ctx.font = `700 40px ${display}`;
      ctx.fillText(String(i + 1), x, yy);
      ctx.fillStyle = "#fff";
      ctx.font = `600 38px ${sans}`;
      ctx.fillText(fit(ctx, name, width - 60), x + 50, yy);
    });
  };
  list("TOP ARTISTAS", insights.artists.map((a) => a.name), 80, 1150, 440);
  list("TOP MÚSICAS", insights.tracks.map((t) => t.name), 560, 1150, 440);

  // Rodapé com destaques
  const chips = [
    insights.genres[0] ? `Gênero: ${insights.genres[0].name}` : null,
    insights.topDecade ? `Década: ${insights.topDecade.label}` : null,
    insights.facts.recentCount ? `Ouve mais ${insights.period}` : null,
  ].filter(Boolean) as string[];
  let x = 80;
  ctx.font = `600 32px ${sans}`;
  chips.forEach((c) => {
    const w = ctx.measureText(c).width + 56;
    if (x + w > W - 80) return;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.roundRect(x, 1640, w, 72, 36);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(c, x + 28, 1688);
    x += w + 18;
  });

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `500 28px ${sans}`;
  ctx.fillText("Feito com Trilha · dados do Spotify", 80, 1830);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas"))), "image/png"));
}
