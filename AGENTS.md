<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All chat models resolve through `src/lib/astra/provider.server.ts` as OpenAI-compatible endpoints configured by env vars (default `AI_BASE_URL`/`AI_API_KEY`/`AI_MODEL`); never hard-code a model or use Lovable AI as Astra's core — the app must run without Lovable AI credits.
- Model registry and reasoning levels live in the database (`models`, `reasoning_levels`), so models are added by data, not code.
- Chat streaming goes through the `/api/chat` server route with the user's bearer token; messages persist server-side per thread, and the client sends only the latest message.
- Authenticated pages live under `src/routes/_authenticated/` with `ssr: false`, since the session lives in browser storage.
