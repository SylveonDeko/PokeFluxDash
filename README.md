# PokeFlux Dashboard

Web dashboard for PokeFlux, the Pokémon collecting bot on Fluxer. Served at https://pokeflux.tech.

SvelteKit 2, Svelte 5, Tailwind 4, adapter-node.

## Run locally

Requirements: Node 22, a Fluxer OAuth2 application, a running PokeFlux bot with its API enabled, and optionally Redis.

```sh
npm install
cp .env.example .env   # then fill in the values
npm run dev            # http://localhost:5173
```

Register `http://localhost:5173/api/auth/callback` as a redirect on the Fluxer application and set it as `FLUXER_REDIRECT_URI`.
`POKEFLUX_API_KEY` and `BOT_JWT_SECRET` must match the bot's `ApiKey` and `JwtSecret`.

Other scripts:

```sh
npm run build    # production build into out/
node out/index.js
npm run check    # svelte-check and i18n generation
npm run lint
```

## Layout

- `src/routes/api/auth` Fluxer OAuth sign in, callback, refresh and sign out.
- `src/lib/server/fluxerApi.ts`, `redisSession.ts` session handling used by `hooks.server.ts`.
- `src/lib/server/backendJwt.ts` mints the per-request user token for the bot.
- `src/lib/server/botApi.ts` server-side bot client (`callBot`), used by the typed client and the `/api/[...path]` proxy.
- `src/lib/api/types.ts` request and response types for every bot endpoint. Safe to import anywhere.
- `src/lib/api/client.server.ts` typed client: `createApi(event)`, plus `unwrap`, `unwrapOrNull` and `toAction`.
- `src/routes/dashboard` signed in sections. `src/lib/config/navigation.ts` lists them for the sidebar.
- `src/lib/i18n` message catalogs. Text lives in `en-US/*.json`; `npm run generate-i18n` builds the typed accessors.

## Using the API client

```ts
// +page.server.ts
import { createApi, unwrap, toAction } from "$lib/api/client.server";

export const load = async (event) => {
  const api = createApi(event);
  return { profile: unwrap(await api.me.get()) };
};

export const actions = {
  favorite: async (event) => {
    const id = String((await event.request.formData()).get("id"));
    return toAction(await createApi(event).pokemon.favorite(id, true));
  },
};
```

Every client method resolves to a `BotResponse` (`{ ok, status, data }` or `{ ok: false, status, error }`) and never throws.
`unwrap` turns a failure into a SvelteKit error page, `toAction` into `fail(status, { error })`.
