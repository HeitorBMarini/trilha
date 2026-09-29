import type { RawStats, SpotifyArtist, SpotifyTrack, TimeRange } from "./types";

// Artistas e músicas fictícios, só para o modo demonstração.
const ARTISTS: [string, string[]][] = [
  ["Maré Alta", ["mpb", "indie"]],
  ["Os Satélites", ["rock nacional", "indie"]],
  ["Luna Vieira", ["pop", "mpb"]],
  ["DJ Farol", ["electronic", "house"]],
  ["Trio Cerrado", ["forro", "mpb"]],
  ["Nina Solar", ["r&b", "pop"]],
  ["Bairro Norte", ["rap", "trap brasileiro"]],
  ["Vento Sul", ["rock", "indie"]],
  ["Clara Neblina", ["bossa nova", "jazz"]],
  ["MC Horizonte", ["funk", "rap"]],
  ["Os Veleiros", ["samba", "pagode"]],
  ["Ícaro Luz", ["pop", "electronic"]],
  ["Banda Aurora", ["rock nacional", "pop"]],
  ["Joana Ribeira", ["mpb", "bossa nova"]],
  ["Estúdio 84", ["electronic", "indie"]],
];

const TITLES = [
  "Quando o Sol Voltar", "Ruas de Neon", "Céu de Agosto", "Última Estação", "Madrugada Azul", "Ponte Aérea",
  "Maresia", "Frequência", "Casa Cheia", "Rádio Pirata", "Horizonte", "Café às Seis", "Linha 4", "Ventania",
  "Chuva de Verão", "Satélite", "Fim de Tarde", "Lua Nova", "Norte", "Pé na Estrada", "Corredor", "Vidro",
  "Primeira Vez", "Papel de Seda", "Onda Longa", "Faróis", "Asfalto", "Semente", "Sábado", "Brisa",
];

const YEARS = [2024, 2023, 2025, 2019, 2021, 2016, 2022, 2008, 2012, 2024, 1998, 2018, 2020, 2014, 1989];

const artist = (i: number): SpotifyArtist => ({
  id: `demo-artist-${i}`,
  name: ARTISTS[i][0],
  genres: ARTISTS[i][1],
  images: [],
  external_urls: { spotify: "https://open.spotify.com/" },
});

const track = (i: number): SpotifyTrack => {
  const a = i % ARTISTS.length;
  const year = YEARS[(i * 7) % YEARS.length];
  return {
    id: `demo-track-${i}`,
    name: TITLES[i % TITLES.length],
    uri: `spotify:track:demo${i}`,
    duration_ms: 150_000 + ((i * 37_000) % 120_000),
    explicit: i % 5 === 0,
    artists: [{ id: `demo-artist-${a}`, name: ARTISTS[a][0] }],
    album: { name: TITLES[i % TITLES.length], release_date: `${year}-03-01`, images: [] },
    external_urls: { spotify: "https://open.spotify.com/" },
  };
};

// Cada período embaralha a ordem de um jeito diferente, para a troca de aba mudar o resultado.
const ORDER: Record<TimeRange, number[]> = {
  short_term: [6, 2, 0, 11, 3, 9, 5, 1, 13, 4, 7, 12, 8, 10, 14],
  medium_term: [0, 2, 1, 6, 12, 3, 13, 5, 11, 7, 4, 8, 9, 14, 10],
  long_term: [1, 0, 12, 13, 2, 7, 8, 4, 10, 6, 3, 5, 14, 11, 9],
};

export function demoStats(range: TimeRange): RawStats {
  const order = ORDER[range];
  const artists = order.map(artist);
  const tracks = Array.from({ length: 30 }, (_, i) => track(order[i % order.length] + ARTISTS.length * Math.floor(i / order.length)));

  // 50 reproduções recentes com pico no fim da tarde e à noite.
  const peak = [8, 12, 13, 18, 19, 20, 21, 22, 22, 23, 21, 20, 19, 7, 17];
  const now = new Date();
  const recent = Array.from({ length: 50 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - Math.floor(i / 8));
    d.setHours(peak[(i * 7) % peak.length], (i * 13) % 60, 0, 0);
    return { played_at: d.toISOString(), track: tracks[(i * 3) % tracks.length] };
  });

  return { user: { name: "Visitante" }, range, artists, tracks, recent };
}
