@AGENTS.md

# Tabesaki — Project Context

## What This Is
A personal Japan dining reservation tracker. Users save 
wishlist restaurants, track reservation platforms and 
booking windows, and get reminded exactly when to book.

## Current State
Fresh scaffold. Supabase connected. Auth not yet implemented.

## Tech Stack
- Next.js 15 App Router + TypeScript strict
- Tailwind CSS + shadcn/ui (Zinc/Maia theme)
- Supabase (Postgres + Auth + RLS)
- TanStack React Query v5
- lucide-react

## Project Structure
src/
  app/          # Next.js App Router pages
  components/   # Reusable UI components
  hooks/        # Custom React Query hooks
  lib/
    supabase/   # client.ts, server.ts, admin.ts
    utils.ts    # cn() utility
  types/        # TypeScript interfaces

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
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_PLACES_API_KEY
ANTHROPIC_API_KEY

## Skills
Supabase agent skills are installed in this project.
Always use them when doing any Supabase-related work:
- Database schema and migrations
- Auth and session handling  
- RLS policies
- supabase-js and @supabase/ssr patterns