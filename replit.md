# Storvo — Replit Environment

## Overview
Storvo is a Nigerian e-commerce platform that lets sellers create and manage online stores with Paystack payment integration. Built with React + Vite + TypeScript on the frontend, backed by Supabase (auth, database, storage, and edge functions).

## Architecture

- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS, shadcn/ui, React Router v6, TanStack Query
- **Backend**: Supabase (hosted) — handles auth, PostgreSQL database, file storage, and Edge Functions
- **Payments**: Paystack (NGN) — split payments via subaccounts, subscriptions
- **Dev server**: Vite on port 5000

## Key Files & Structure

```
src/
  App.tsx               # Routes
  main.tsx              # Entry point
  contexts/
    AuthContext.tsx      # Supabase auth state
  integrations/
    supabase/client.ts  # Supabase client (uses VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY)
    lovable/index.ts    # OAuth helper (now wraps supabase.auth.signInWithOAuth directly)
  pages/                # All route pages
  components/           # Reusable UI components
  hooks/                # Custom hooks
supabase/
  functions/            # Edge Functions (hosted on Supabase, called via supabase.functions.invoke())
    initialize-payment/
    paystack-webhook/
    create-subaccount/
    verify-domain/
  migrations/           # SQL schema (applied to Supabase project atmaningbrrrdfiajzcy)
```

## Environment Variables
Set in Replit shared environment:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
- `VITE_SUPABASE_PROJECT_ID` — Supabase project ID

The Paystack secret key (`PAYSTACK_SECRET_KEY`) lives only in Supabase Edge Function secrets, never exposed to the frontend.

## Running the App
```bash
npm run dev   # starts Vite dev server on port 5000
npm run build # production build to dist/
```

## Migration from Lovable
- Removed `@lovable.dev/cloud-auth-js` dependency usage; Google OAuth now uses `supabase.auth.signInWithOAuth` directly
- Removed `lovable-tagger` Vite plugin
- Updated Vite server config: `host: "0.0.0.0"`, `port: 5000`, `allowedHosts: true` for Replit proxy compatibility
- Fixed CSS `@import` ordering (must precede `@tailwind` directives)
- Supabase remains the backend — no migration to Replit PostgreSQL needed
