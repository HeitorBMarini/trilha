/* eslint-disable @next/next/no-img-element */

// Capa ou foto; sem imagem (modo demonstração), gera um gradiente estável a partir do nome.
function hue(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return 95 + (h % 95); // tons de verde a azul-esverdeado, no tema do app
}

export function Cover({
  src,
  name,
  className = "",
  round = false,
}: {
  src?: string;
  name: string;
  className?: string;
  round?: boolean;
}) {
  const shape = round ? "rounded-full" : "rounded-[22%]";
  if (src) return <img src={src} alt="" loading="lazy" className={`object-cover ${shape} ${className}`} />;
  const h = hue(name);
  const initials = name
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      aria-hidden
      className={`grid place-items-center font-display font-bold text-white/90 [container-type:size] ${shape} ${className}`}
      style={{ background: `linear-gradient(135deg, hsl(${h} 70% 55%), hsl(${(h + 50) % 360} 75% 40%))` }}
    >
      {/* cqmin: o tamanho acompanha o do círculo/quadrado */}
      <span className="leading-none" style={{ fontSize: "36cqmin" }}>
        {initials}
      </span>
    </div>
  );
}
