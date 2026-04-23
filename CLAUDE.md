# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # localhost:3000
npm run build
npm run lint     # ESLint 9
```

Required env: `NEXT_PUBLIC_API_URL` (backend URL, default `http://localhost:3001`).  
Supabase credentials are read client-side via `@supabase/supabase-js` — add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` if auth pages break.

## Architecture

Next.js 16 App Router, React 19, TypeScript strict. Tailwind CSS v4.

### Pages

| Route | Purpose |
|---|---|
| `/auth` | Supabase Auth login/signup |
| `/onboarding` | Company profile form (ATECO, dimensione, obiettivi, budget, provincia) |
| `/risultati` | Ranked bandi list — calls `GET /api/bandi/:profileId` |
| `/bando/[id]` | Bando detail + "Candidati" CTA → `POST /api/application/save` |
| `/application/[id]` | Full application package (scheda, checklist, business plan, timeline, FAQ, chat) |
| `/candidature` | Dashboard — list of user's saved applications |
| `/visura` | PDF upload → `POST /api/visura/upload` + `POST /api/visura/parse` |
| `/profilo` | Edit company profile |
| `/dashboard` | Summary view |

### API calls

Every page that calls the backend constructs the base URL as:
```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

No dedicated API client layer — fetch calls are inline in each page/component.

### Auth

`@supabase/ssr` handles server-side session. Protected pages check session in server components; the JWT is passed as `Authorization: Bearer` to the backend on client fetches.

### UI

- Radix UI: `@radix-ui/react-checkbox`, `@radix-ui/react-select`, `@radix-ui/react-progress`
- Icons: `lucide-react`
- Class merging: `clsx`
- No component library (shadcn or similar) — components are built directly with Tailwind + Radix primitives
