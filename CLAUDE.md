@AGENTS.md

# Tabesaki — Project Context

## What This Is
A personal Japan dining reservation tracker. Users save
wishlist restaurants, track reservation platforms and
booking windows, and get reminded exactly when to book.

## Current State
Phase 1 (restaurant management) and Phase 3 (AI extraction) complete.
Phase 2 (wishlist + travel dates) is next.
See session memory for full build status.

## Project Structure
src/
  app/          # Next.js App Router pages
  components/   # Reusable UI components
  hooks/        # Custom React Query hooks
  lib/
    supabase/   # client.ts, server.ts, admin.ts
    utils.ts    # cn() utility
  types/        # TypeScript interfaces
  └── docs/
    └── PRD.md

## Database Schema
[paste the full confirmed schema here]

## Security Rules
- user_id always from session, never request body
- RLS on all user-specific tables
- Restaurants/platforms are public (shared)
- Wishlist/travel_dates are private (user-specific)
- API keys server-side only

## Key Conventions
- Prices always in JPY as integers
- snake_case in DB, camelCase in TypeScript
- shadcn/ui components before custom components
- Record pattern for all variant mappings

## Environment Variables Required
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY   ← NOT ANON_KEY — all Supabase clients use this name
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_PLACES_API_KEY
ANTHROPIC_API_KEY
SERPER_API_KEY

## Agent Workflow
Before writing any code for any task:
1. Confirm your understanding of what I'm asking
2. List the files you'll create or modify
3. Identify any ambiguities or decisions I should make
4. Present a plan and wait for my approval before implementing

## Skills
Supabase agent skills are installed in this project.
Always use them when doing any Supabase-related work:
- Database schema and migrations
- Auth and session handling
- RLS policies
- supabase-js and @supabase/ssr patterns

## Supabase Conventions
- Before referencing any DB column or env var, verify the actual name in the schema/migration files and .env.local (e.g., use 'city' not 'city_name', confirm NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY vs ANON_KEY).

## Next.js
- Keep server-only code (next/headers, cookies) in *.server.ts files and never mix it with client-imported modules to avoid Pages/App Router import errors.

## Environment Limits
- This machine has macOS Full Disk Access / file-write permission restrictions; flag permission-dependent steps (git push, file overwrites, running migrations) early and ask the user to run them manually rather than retrying repeatedly.

## Verification
- After multi-file changes, run tsc/type-checks and verify UI elements (buttons, navigation) actually render and wire up before declaring the task complete.

---

# Japan Dining Reservation Tracker

## Product requirements

Full PRD is at `docs/PRD.md`. Read it before making any architectural decisions,
adding new features, writing migrations, or modifying the data model.

Key sections to reference for common tasks:

| Task | PRD section |
|------|-------------|
| Writing a migration | §6 Data model — tables, enums, constraints, relationships |
| Implementing search | §4 Search flow |
| Implementing AI extraction | §5 AI extraction flow |
| Calculating booking_reminder_datetime | §6 — booking_reminder_datetime calculation |
| Writing RLS policies | §7 Security model |
| Implementing the cron route | §8 Notification architecture |
| Deciding what to build | §12 Scope boundaries |

## Stack

- **Frontend:** Next.js 16 App Router, TypeScript strict mode, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Postgres, Auth, RLS, Real-time)
- **Mobile:** React Native + Expo, EAS Build
- **AI extraction:** Claude API — server-side only, never call from client
- **Restaurant search:** Google Places Text Search API — server-side only
- **Platform URL discovery:** Serper.dev — do NOT switch to Google Custom Search Engine (see below)
- **SPA rendering:** Puppeteer (headless Chromium) — see Puppeteer rules below
- **Notifications:** Vercel cron (`0 * * * *`) + Expo Push Notification Service
- **Deployment:** Vercel (web), EAS Build (mobile)

## Critical rules

- Never expose `ANTHROPIC_API_KEY`, `GOOGLE_PLACES_API_KEY`, `SERPER_API_KEY`, or `CRON_SECRET` to the client
- Always derive `user_id` from `auth.uid()` — never from the request body
- `restaurants` and `reservation_platforms` are public (shared across users)
- `wishlist`, `travel_dates`, and `push_tokens` are private — RLS required
- Never auto-select a restaurant from search results — always show a candidate list
- Never strip non-ASCII characters from the restaurant name search field
- `closed_days_of_week = NULL` means unknown — show a warning, do not silently allow date selection
- `booking_reminder_datetime` must be recalculated whenever platform priority or advance fields change
- All datetimes stored as `timestamptz`; cron queries run in UTC

---

## File writing — IMPORTANT

The Edit and Write tools and `cp` all fail with EPERM on most project files.
Always write files by piping through `tee`:

```bash
cat /tmp/yourfile | tee "/path/to/target" > /dev/null
```

Workflow: write content to `/tmp/filename` first, then tee to the project path.
Use quoted paths for files inside `(dashboard)` or other parenthesised directories.

---

## Google Places API — field mask

Only use field names that are verified to exist in the Places API (New).
`businessLinks` does NOT exist and causes a 400 INVALID_ARGUMENT error.
Confirmed valid fields used in this project:
`id, displayName, formattedAddress, nationalPhoneNumber, websiteUri, rating, userRatingCount, regularOpeningHours, businessStatus`

Always check the Places API (New) reference before adding a new field to `X-Goog-FieldMask`.

---

## Platform URL discovery — use Serper.dev, not Google CSE

Google Custom Search Engine requires three independent configurations to work
(project-level API enablement + API key restriction + CSE ID) and is error-prone to set up.
This project uses Serper.dev instead — one API key, no project configuration.

Do NOT suggest switching to Google CSE. The `GOOGLE_CSE_ID` env var is present but unused.

---

## Puppeteer in Next.js

Puppeteer uses native Chromium binaries. Without special config Next.js bundles it
incorrectly, breaking binary path resolution at runtime.

Two things are required — both must be present:

1. `next.config.ts` must include:
```ts
serverExternalPackages: ["puppeteer"],
```

2. Import must be dynamic inside the function body, never top-level:
```typescript
// CORRECT
async function fetchWithBrowser(...) {
  const { default: puppeteer } = await import("puppeteer");
  ...
}

// WRONG — causes bundling issues
import puppeteer from "puppeteer";
```

**Vercel deployment note:** Bundled Chromium (~300MB) exceeds Vercel's 50MB function limit.
Before deploying, swap `puppeteer` → `puppeteer-core` + `@sparticuz/chromium`.

---

## Claude API — JSON response parsing

Claude sometimes wraps JSON output in markdown code blocks (` ```json ... ``` `)
even when the prompt says "return only JSON". Never use bare `JSON.parse(text)`.

Always extract JSON robustly:
```typescript
const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
const jsonStr = jsonMatch
  ? jsonMatch[1]
  : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
const result = JSON.parse(jsonStr);
```