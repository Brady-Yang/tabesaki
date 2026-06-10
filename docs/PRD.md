# Japan Dining Reservation Tracker — PRD

**Version:** 1.2  
**Status:** Pre-development  
**Type:** Personal SaaS / Phase 4 capstone (14-week learning plan)

---

## Table of contents

1. [Problem statement](#1-problem-statement)
2. [Users and goals](#2-users-and-goals)
3. [Feature list](#3-feature-list)
4. [Search flow](#4-search-flow)
5. [AI extraction flow](#5-ai-extraction-flow)
6. [Data model](#6-data-model)
7. [Security model](#7-security-model)
8. [Notification architecture](#8-notification-architecture)
9. [Tech stack](#9-tech-stack)
10. [Build phases](#10-build-phases)
11. [Risks and mitigations](#11-risks-and-mitigations)
12. [Scope boundaries](#12-scope-boundaries)

---

## 1. Problem statement

Booking high-end Japanese restaurants — particularly omakase sushi, kaiseki, and tasting menus — requires knowing exactly when and how to book. This knowledge is:

- **Fragmented** — spread across travel blogs, Reddit threads, and personal notes with no single source of truth
- **Time-sensitive** — reservations open on a specific date, often exactly 1–3 months ahead, at a specific time (e.g. 10:00 AM JST)
- **Platform-specific** — six or more platforms (Pocket Concierge, TableAll, Tablecheck, Omakase.in, Ikyu, Tabelog) each with different rules
- **Costly to miss** — missing the window means waiting a full month for the next opening cycle

Booking windows follow two distinct patterns:
- **Rolling advance** — reservations open X days before the desired date
- **Fixed calendar** — reservations for a given month open on a fixed day of a prior month (e.g. October bookings open on September 1st)

Both patterns must be modelled correctly to calculate accurate reminder datetimes.

---

## 2. Users and goals

### Primary persona

Frequent Japan traveller targeting omakase, kaiseki, and tasting menu restaurants. Plans multiple trips per year. May know restaurant names in Japanese (kanji/kana). Currently manages bookings through a mix of notes, calendar reminders, and memory.

### User goals

- Find and add restaurants with booking info auto-populated via AI extraction
- Know exactly when reservations open and receive a push notification at the right moment
- Track multiple desired dates per restaurant with priority rankings and fallback options
- Never accidentally select a date the restaurant is closed

---

## 3. Feature list

### F1 — Restaurant management

Three-field search (name + cuisine + city) → Google Places candidate list → user selects → deduplication check by `google_place_id` → confirmation card → AI extraction → user review and confirm → save to shared restaurant record.

- Cuisine selection in the app is the source of truth for the `cuisine` field — Google Places does not return useful granularity for Japanese fine dining
- Name field accepts Japanese input (kanji, kana) — non-ASCII characters must not be stripped before sending to the Places API
- If a restaurant already exists by `google_place_id`, load the existing record and skip extraction

### F2 — Reservation platform tracking

One restaurant can have multiple platform entries. Priority ranking determines which platform is used to calculate `booking_reminder_datetime`.

Supported platforms: `Omakase.in`, `TableCheck`, `Pocket Concierge`, `TableAll`, `Tabelog`, `Ikyu`, `Other`

Two booking window types:
- **rolling** — `advance_days` before the desired date
- **fixed_calendar** — `open_day_of_month` of the month that is `open_months_prior` before the reservation month

Booking open time stored as structured fields: `booking_open_hour` (0–23), `booking_open_minute` (0–59, default 0), `booking_open_tz` (default `Asia/Tokyo`).

### F3 — Personal wishlist

User-specific list linking to shared restaurant records. Personal notes per entry. Same restaurant can be wishlisted by multiple users independently.

### F4 — Travel date management

Each wishlist item supports multiple desired dates with priority ranking (1 = first choice). `booking_reminder_datetime` is auto-calculated on save. Date picker disables `closed_days_of_week`. If `closed_days_of_week` is NULL, show a "closure days unknown" warning — do not silently allow the date.

Travel date statuses: `Watching` → `Booking Soon` → `Booked` → `Visited` / `Missed`

### F5 — Booking reminders

Vercel cron job runs hourly (`0 * * * *`). Queries `travel_dates` for rows where `booking_reminder_datetime` falls within the current hour window. Fires Expo push notifications to the user's device token with: restaurant name, desired date, party size, and direct link to the reservation platform. In-app alerts serve as fallback.

### F6 — Dashboard list and sort view

All wishlisted restaurants in a sortable, filterable view. Sort by: name, cuisine, price, next reminder datetime, status. Filter by: status, cuisine, price range, date range. Visual indicator for upcoming booking windows (e.g. "Booking opens in 3 days").

---

## 4. Search flow

```
Search inputs:
  [ Restaurant name (English or Japanese) ] [ Cuisine ▾ ] [ City ▾ ]
                          ↓
  Combined Places query: "{name} {cuisine_keyword} {city}"
                          ↓
  Candidate list (3–5 results):
    - Name
    - Neighbourhood + city
    - Photo thumbnail (from Places if available)
    - Rating + review count
    - "Permanently closed" badge if applicable
                          ↓
  User selects candidate
                          ↓
  Check: google_place_id already in restaurants table?
    YES → load existing record, add to wishlist, skip extraction
    NO  → show confirmation card (name, full address, website, phone, Maps link)
            → user confirms
              → trigger AI extraction
```

### Cuisine enum values

`Omakase Sushi` | `Kaiseki` | `Tempura` | `Soba/Kappo` | `Teppanyaki` | `Yakiniku` | `Other`

### City dropdown values

`Tokyo` | `Kyoto` | `Osaka` | `Hokkaido` | `Fukuoka` | `Other`

---

## 5. AI extraction flow

Triggered after user confirms a new restaurant from the candidate list.

**Step 1 — Closed days (Google Places)**
`regularOpeningHours.periods` from the Places API details call. Days absent from the periods array are closed days. More reliable than AI extraction; used as the authoritative source.

**Step 2 — Platform URL discovery (Serper)**
A single Google Search query via Serper.dev scoped to the six known platform domains returns candidate URLs with titles and snippets. No AI needed here.

**Step 3 — Page fetching**
Candidate URLs are fetched server-side. SPA-based platforms (Omakase.in, Pocket Concierge, etc.) return shell HTML from plain fetch — these are re-fetched via Puppeteer (headless Chromium) to get rendered text content.

**Step 4 — Claude filter + extract**
Claude receives: restaurant name + address, Serper search results (URL + title + snippet), restaurant website content, and fetched platform page content. Claude:
1. Verifies each URL is for the correct restaurant (title/snippet/content match against name + address — same-name restaurants are common in Japan)
2. Extracts reservation rules from verified pages only

**Extraction targets:**
- Reservation platform names and URLs (verified against correct restaurant)
- `advance_type` classification (`rolling` or `fixed_calendar`)
- `advance_days` (rolling) or `open_day_of_month` + `open_months_prior` (fixed_calendar)
- `booking_open_hour`, `booking_open_minute`, `booking_open_tz`
- Course pricing (JPY) and course descriptions
- Special booking notes

Note: `closed_days_of_week` is sourced from Places API (Step 1), not AI extraction.

Extracted data is presented to the user for review and confirmation before saving. If extraction fails or is incomplete, graceful fallback to manual entry.

---

## 6. Data model

### `restaurants` — public

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `google_place_id` | text | Unique — deduplication key |
| `name` | text | Not null. Stored as returned by Places API (may be Japanese) |
| `address` | text | |
| `cuisine` | enum `cuisine_type` | Set by user on search. See enum below. |
| `website` | text | |
| `phone` | text | |
| `price_range_min` | integer | JPY |
| `price_range_max` | integer | JPY |
| `price_notes` | text | e.g. "Lunch ¥15,000 / Dinner ¥30,000–¥50,000" |
| `closed_days_of_week` | smallint[] | 0=Sun–6=Sat. NULL=unknown, {}=open every day. Check constraint: values 0–6 only |
| `ai_extracted_at` | timestamptz | |
| `created_at` | timestamptz | |

### `reservation_platforms` — public

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `restaurant_id` | uuid | FK → restaurants |
| `website` | enum `platform_type` | Omakase.in \| TableCheck \| Pocket Concierge \| TableAll \| Tabelog \| Ikyu \| Other |
| `url` | text | |
| `priority` | integer | 1 = highest. Determines which platform calculates `booking_reminder_datetime` |
| `advance_type` | enum `advance_type` | `rolling` \| `fixed_calendar` |
| `advance_days` | integer | Rolling only |
| `open_day_of_month` | smallint | Fixed calendar only — day of month bookings open (e.g. 1) |
| `open_months_prior` | smallint | Fixed calendar only — months before reservation month (e.g. 1) |
| `booking_open_hour` | smallint | 0–23 |
| `booking_open_minute` | smallint | 0–59, default 0 |
| `booking_open_tz` | text | Default `Asia/Tokyo` |
| `course_price` | integer | JPY, platform-specific |
| `course_description` | text | e.g. "Omakase 12 courses" |
| `notes` | text | |
| `ai_extracted` | boolean | |
| `created_at` | timestamptz | |

Unique constraint: `(restaurant_id, website)`

### `wishlist` — private (user-specific)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → auth.users |
| `restaurant_id` | uuid | FK → restaurants |
| `notes` | text | Personal notes |
| `created_at` | timestamptz | |

Unique constraint: `(user_id, restaurant_id)`

### `travel_dates` — private (user-specific)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `wishlist_id` | uuid | FK → wishlist |
| `desired_date` | date | Validated against `closed_days_of_week` in app layer |
| `priority` | integer | 1 = first choice |
| `party_size` | integer | Default 2 |
| `status` | enum `travel_date_status` | Watching \| Booking Soon \| Booked \| Visited \| Missed |
| `booking_reminder_datetime` | timestamptz | Calculated — see logic below |
| `booked_at` | timestamptz | |
| `confirmation_notes` | text | |
| `created_at` | timestamptz | |

Unique constraints: `(wishlist_id, desired_date)` and `(wishlist_id, priority)`

### `push_tokens` — private (user-specific)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → auth.users, unique |
| `token` | text | Expo push token — upsert on app load |
| `updated_at` | timestamptz | |

### Enum types

```sql
CREATE TYPE cuisine_type AS ENUM (
  'Omakase Sushi', 'Kaiseki', 'Tempura',
  'Soba/Kappo', 'Teppanyaki', 'Yakiniku', 'Other'
);

CREATE TYPE platform_type AS ENUM (
  'Omakase.in', 'TableCheck', 'Pocket Concierge',
  'TableAll', 'Tabelog', 'Ikyu', 'Other'
);

CREATE TYPE advance_type AS ENUM (
  'rolling', 'fixed_calendar'
);

CREATE TYPE travel_date_status AS ENUM (
  'Watching', 'Booking Soon', 'Booked', 'Visited', 'Missed'
);
```

### Relationship map

```
auth.users
    │
    ├── wishlist ──────────────── restaurants
    │       │                          │
    │       └── travel_dates          └── reservation_platforms
    │
    └── push_tokens
```

### `booking_reminder_datetime` calculation

**Rolling advance:**
```
reminder = (desired_date − advance_days) at booking_open_hour:booking_open_minute booking_open_tz
```

**Fixed calendar:**
```
reminder = (first day of reservation_month − open_months_prior months)
           + (open_day_of_month − 1 days)
           at booking_open_hour:booking_open_minute booking_open_tz
```

The highest-priority platform (lowest `priority` integer) for the restaurant is used to calculate the reminder. Recalculate and update `booking_reminder_datetime` whenever platform priority or advance fields change.

---

## 7. Security model

| Table | Access |
|-------|--------|
| `restaurants` | Readable and writable by all authenticated users |
| `reservation_platforms` | Readable and writable by all authenticated users |
| `wishlist` | Owner only (RLS: `user_id = auth.uid()`) |
| `travel_dates` | Owner only via wishlist join (RLS) |
| `push_tokens` | Owner only (RLS: `user_id = auth.uid()`) |

- Row Level Security enforced at database level via Supabase Postgres policies
- API keys (Google Places, Anthropic) are server-side only — never exposed to the client
- `user_id` always derived from the authenticated session (`auth.uid()`), never from the request body
- Vercel cron route protected by `CRON_SECRET` environment variable — verified on every request

---

## 8. Notification architecture

**Delivery path:** Vercel cron → Supabase query → Expo Push Notification Service → user device

**Cron schedule:** `0 * * * *` (hourly, free on Vercel Hobby)

**Query pattern:**
```sql
SELECT td.*, r.name, r.cuisine, rp.url, pt.token
FROM travel_dates td
JOIN wishlist w ON w.id = td.wishlist_id
JOIN restaurants r ON r.id = w.restaurant_id
JOIN reservation_platforms rp ON rp.restaurant_id = r.id AND rp.priority = 1
JOIN push_tokens pt ON pt.user_id = w.user_id
WHERE td.booking_reminder_datetime <= NOW()
  AND td.booking_reminder_datetime > NOW() - INTERVAL '1 hour'
  AND td.status IN ('Watching', 'Booking Soon')
```

**Notification payload:** restaurant name, desired date, party size, direct URL to reservation platform

**Push token management:** Expo push token captured on mobile app load and upserted to `push_tokens` by `user_id`

**Fallback:** In-app alerts for users without push tokens or on web. Dashboard "Booking opens in N days" indicator as tertiary fallback.

**Note:** Vercel Hobby cron has a minimum 1-hour interval. Notifications may fire up to 59 minutes after the exact booking open time. Acceptable for date-level booking windows. Upgrade to Vercel Pro for sub-hourly precision if needed.

---

## 9. Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 15 App Router, TypeScript strict mode, Tailwind CSS, shadcn/ui |
| Mobile | React Native + Expo, EAS Build |
| Database | Supabase Postgres |
| Auth | Supabase Auth |
| Real-time | Supabase Real-time |
| AI extraction | Claude API (Anthropic) |
| Restaurant search | Google Places Text Search API |
| Platform URL discovery | Serper.dev (Google Search API) |
| SPA page rendering | Puppeteer (headless Chromium) — swap to `puppeteer-core` + `@sparticuz/chromium` for Vercel |
| Push notifications | Expo Push Notification Service |
| Cron | Vercel cron jobs |
| Web deployment | Vercel |
| Mobile deployment | EAS Build |

---

## 10. Build phases

### Phase 1 — Foundation and restaurant management
Full schema migration (all enums, all tables, RLS policies). Supabase Auth setup. Three-field restaurant search with Places candidate list. Deduplication check. Confirmation card. Manual platform entry with `advance_type` selection. Basic CRUD for restaurants and platforms.

### Phase 2 — Wishlist and travel dates
Wishlist management. Travel date CRUD with priority ranking. `booking_reminder_datetime` calculation for both advance types. Date picker with `closed_days_of_week` validation and NULL warning. Dashboard list view with sort and filter by cuisine.

### Phase 3 — AI extraction
Claude API integration. Server-side extraction route. Prompt engineering targeting `advance_type` classification, structured time fields, `closed_days_of_week`, and course pricing. Review and confirm UI. Manual fallback when extraction fails or is incomplete.

### Phase 4 — Mobile app and push notifications
React Native + Expo app. Push token capture on load (upsert to `push_tokens`). Vercel cron route (`/api/cron/reminders`) with `CRON_SECRET` verification. Hourly query against `booking_reminder_datetime` window. Expo push delivery with deep link to reservation platform URL.

---

## 11. Risks and mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| AI misclassifying `advance_type` — rolling vs fixed calendar not always explicit on restaurant sites | High | Human review mandatory before save. UI shows detected type with ability to override. Manual fallback always available. |
| Timezone errors — user local time vs JST booking open time | High | `booking_open_tz` stored explicitly (default `Asia/Tokyo`). All datetimes stored as `timestamptz`. Cron queries in UTC. Display in user's local timezone. |
| Google Places returns wrong restaurant despite three-field search | Medium | User always selects from candidate list — never auto-matched. Confirmation card shown before extraction is triggered. |
| Vercel Hobby cron 1-hour minimum — notification up to 59 min late | Medium | Acceptable for date-level booking windows. Upgrade to Vercel Pro if precision becomes critical. |
| Push notification reliability (Expo/EAS) | Medium | In-app alerts as fallback. Dashboard countdown as tertiary fallback. |
| `closed_days_of_week` stale or incorrect after extraction | Low | NULL treated as unknown — user warned, not silently allowed. `ai_extracted_at` timestamp visible. User can edit at any time. |

---

## 12. Scope boundaries

### In scope
- Restaurant research and data management (web)
- Push notification reminders (mobile)
- AI-assisted reservation rule extraction with human review
- Rolling and fixed calendar booking window types
- Weekly closure day validation
- Multi-platform tracking per restaurant with priority ranking
- Three-field restaurant search (name + cuisine + city)
- Japanese input in restaurant name field
- Dashboard filter by cuisine enum
- Direct links to reservation platforms

### Out of scope
- Booking on the user's behalf
- Social features (follows, reviews, sharing)
- Seasonal or irregular closure patterns (v1)
- Public directory or community features
- Restaurants outside Japan
- Freeform cuisine text entry (enum only in v1)
- Payments or in-app deposits
- Restaurant discovery beyond Google Places integration
