# MindLink

Creators build AI characters of themselves from approved knowledge, a persona and a cloned
voice. Audiences chat with them or call them in the browser. Answers are grounded in the
creator's knowledge (RAG).

## Layout

| Path | What |
|---|---|
| `apps/web` | Next.js 16 app (Vercel): marketplace, creator studio, chat and call UI |
| `services/backend` | Python (uv): `api` (FastAPI), `worker` (knowledge ingestion), `voice` (Pipecat) |
| `supabase` | Migrations, pgTAP tests, local config |

The browser reads and writes plain data through Supabase under RLS. Anything that touches a
provider key or a multi-step invariant goes through the Python backend.

## Prerequisites

- Node.js 22+ and pnpm 11 (`corepack enable`)
- [uv](https://docs.astral.sh/uv/) (installs Python 3.12 itself)
- Docker Desktop, for the local Supabase stack and image builds

## Local setup

```bash
pnpm install
pnpm db:start            # local Supabase; prints the URL, publishable and secret keys
cp apps/web/.env.example apps/web/.env.local
cp services/backend/.env.example services/backend/.env
```

Fill the values printed by `pnpm db:start` into both env files, plus provider keys in the
backend `.env`. Then:

```bash
pnpm dev                                                           # web on :3000
uv run --directory services/backend uvicorn mindlink.api.app:create_app --factory --reload --port 8000
```

Magic-link emails from the local stack appear in Mailpit at http://127.0.0.1:54324.

## Checks

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm db:test                                   # pgTAP access-control suite
uv run --directory services/backend ruff check .
uv run --directory services/backend pyright
uv run --directory services/backend pytest
```

## Secrets

`NEXT_PUBLIC_*` values ship to the browser: only the Supabase URL, publishable key, API URL
and feature flags belong there. The Supabase secret key and all provider keys live only in
the backend environment.
