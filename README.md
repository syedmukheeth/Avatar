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

## Deploy

| Part | Host | Config |
|---|---|---|
| Web app (`apps/web`) | Vercel | Project settings (below) |
| API (`services/backend`) | Render | `render.yaml` Blueprint + `services/backend/Dockerfile` |
| Voice (Pipecat, later) | VM | WebRTC needs UDP and long-lived calls |

### Web on Vercel

**Showcase mode:** with no Supabase variables set, the web app runs standalone on sample
creators, a creator studio saved in `localStorage`, and browser voice calls.

Add `GEMINI_API_KEY` (server-only, never `NEXT_PUBLIC_`) and the characters answer with a real
model, grounded in their knowledge and citing it, and speak in per-character Gemini voices.
Requests are rate limited per IP with a daily cap (`src/lib/ai/rate-limit.ts`), and the app
falls back to local answers whenever the model is unavailable or out of quota.

| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio key. Free-tier keys hit quota quickly; enable billing before showing the site to clients |

Set both Supabase variables to switch to the full product with real accounts and uploads.

Project settings: **Root Directory** `apps/web`, **Framework Preset** Next.js, no command
overrides (Vercel installs the pnpm workspace from the repo root). Environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `NEXT_PUBLIC_API_URL` | Render service URL, e.g. `https://mindlink-api.onrender.com` |

### API on Render

Render → **New → Blueprint** → this repo. It creates `mindlink-api` from `render.yaml`,
builds the Dockerfile and asks for the secrets once. It deploys only after CI passes on
`main`, and only when `services/backend/**` changes.

| Variable | Value |
|---|---|
| `ALLOWED_ORIGINS` | Web origins, comma-separated: `https://<your-domain>,https://<project>.vercel.app` |
| `ALLOWED_ORIGIN_REGEX` | Optional, for preview deployments: `^https://<project>-[a-z0-9-]+-<team>\.vercel\.app$` |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Supabase project (secret key: server only) |
| `DATABASE_URL` | Supabase **session pooler** URL (IPv4, port 5432). Render cannot reach the IPv6-only direct host |
| `GROQ_API_KEY`, `GEMINI_API_KEY`, `CARTESIA_API_KEY` | Providers |

Check it with `https://<render-url>/health` (liveness) and `/ready` (config and database).
The free plan sleeps after 15 idle minutes; switch `plan` in `render.yaml` before launch.
