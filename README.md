# trilha

Retrospectiva musical do Spotify em qualquer época do ano: seus artistas e músicas favoritos, gêneros, décadas e horário de escuta, com um card pronto para os stories.

## O que dá para fazer

- **Top artistas e músicas** em 4 semanas, 6 meses ou 1 ano
- **Gráficos** de gêneros, décadas e um relógio de escuta de 24 horas
- **Card de story** (1080×1920) gerado no navegador, para baixar ou compartilhar
- **Link compartilhável**: a retrospectiva vai comprimida no `#` da URL, então quem recebe vê sem login e nada é salvo em servidor
- **Playlist** com as suas top músicas, criada direto na sua conta
- **Modo demonstração** para quem não tem acesso ao login

## Por que existe um modo demonstração

Desde fevereiro de 2026, apps novos da Web API do Spotify ficam em modo de desenvolvimento: o dono precisa de Premium e **só 5 contas cadastradas manualmente** podem fazer login. Para qualquer visitante conseguir ver o projeto, a demonstração usa artistas fictícios ou, se existir, o arquivo `public/demo-snapshot.json` com uma retrospectiva real exportada pelo botão "Exportar para a demonstração".

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · Recharts (Chart do shadcn) · Spotify Web API

## Login e segurança

- Fluxo **Authorization Code** do Spotify feito no servidor, com `state` contra CSRF
- Tokens em cookies `httpOnly`, renovados automaticamente com o refresh token
- Escopos mínimos: `user-top-read`, `user-read-recently-played`, `playlist-modify-private`

## Rodando localmente

1. Crie um app em https://developer.spotify.com/dashboard com a Redirect URI `http://127.0.0.1:3009/api/auth/callback` e cadastre sua conta em **User Management**.
2. Copie `.env.example` para `.env.local` e preencha as credenciais.
3. Rode:

```bash
npm install
npm run dev -- -p 3009 -H 127.0.0.1
```

Acesse http://127.0.0.1:3009 (não use `localhost`, o Spotify recusa).

Dados fornecidos pelo Spotify. Este projeto não é afiliado ao Spotify.
