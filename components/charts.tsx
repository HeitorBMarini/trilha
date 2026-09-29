"use client";

import { Bar, BarChart, CartesianGrid, LabelList, PolarAngleAxis, PolarGrid, Radar, RadarChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { Insights } from "@/lib/stats";

const pct = (v: number) => `${Math.round(v * 100)}%`;

export function GenresChart({ genres }: { genres: Insights["genres"] }) {
  const data = genres.map((g) => ({ genre: g.name, share: Math.round(g.share * 100) }));
  const config = { share: { label: "Participação", color: "var(--chart-2)" } } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40 }}>
        <XAxis type="number" hide domain={[0, "dataMax"]} />
        <YAxis dataKey="genre" type="category" tickLine={false} axisLine={false} width={120} tick={{ fill: "var(--foreground)" }} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(v) => `${v}% dos seus artistas`} />} />
        <Bar dataKey="share" fill="var(--color-share)" radius={8}>
          <LabelList dataKey="share" position="right" formatter={(v) => `${v}%`} className="fill-muted-foreground" fontSize={12} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function DecadesChart({ decades }: { decades: Insights["decades"] }) {
  const data = decades.map((d) => ({ decade: d.label, count: d.count, share: d.share }));
  const config = { count: { label: "Músicas", color: "var(--chart-3)" } } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
      <BarChart data={data} margin={{ top: 24 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="decade" tickLine={false} axisLine={false} tickMargin={10} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent formatter={(v, _n, item) => `${v} músicas (${pct(item.payload.share)})`} />}
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={8}>
          <LabelList dataKey="count" position="top" className="fill-muted-foreground" fontSize={12} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function ClockChart({ hours }: { hours: number[] }) {
  const data = hours.map((plays, h) => ({ hour: `${String(h).padStart(2, "0")}h`, plays }));
  const config = { plays: { label: "Reproduções", color: "var(--chart-1)" } } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="mx-auto aspect-square max-h-[300px] w-full">
      <RadarChart data={data} outerRadius="72%">
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <PolarGrid gridType="circle" />
        <PolarAngleAxis
          dataKey="hour"
          tick={({ x, y, payload, textAnchor }) =>
            Number(String(payload.value).slice(0, 2)) % 3 === 0 ? (
              <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="middle" className="fill-muted-foreground text-[11px]">
                {payload.value}
              </text>
            ) : (
              <g />
            )
          }
        />
        <Radar dataKey="plays" fill="var(--color-plays)" fillOpacity={0.45} stroke="var(--color-plays)" strokeWidth={2} />
      </RadarChart>
    </ChartContainer>
  );
}
