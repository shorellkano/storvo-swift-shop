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
  lib/
    teamPermissions.ts  # TeamRole type, ROLE_LABELS, ROLE_COLORS, Permission type, hasPermission()
  hooks/
    useStore.ts         # Unified store fetch - checks ownership then team membership, returns {store, role, loading, isOwner}
    useSubscription.ts  # Pro plan check and product count limits
  pages/
    dashboard/
      TeamMembersPage.tsx     # Invite/manage team members (Pro-only, max 5)
    InviteAccept.tsx           # Accept team invitation via token link
  components/dashboard/
    DashboardSidebar.tsx       # Now accepts `role` prop, filters menu items by permission
supabase/
  functions/            # Edge Functions (hosted on Supabase, called via supabase.functions.invoke())
    initialize-payment/
    paystack-webhook/
    create-subaccount/
    verify-domain/
  migrations/           # SQL schema (applied to Supabase project atmaningbrrrdfiajzcy)
    20260417000001_team_roles.sql  # team_members, team_invitations, activity_log + RLS
```

## Features Implemented

### Verified Seller System
- `verification_applications` table with RLS
- `verification-documents` private storage bucket
- VerificationPage (`/dashboard/verification`) - full ID + bank details form
- VerifiedBadge component shown on storefront and product modals
- DB trigger: auto-sets `stores.is_verified = true` when admin approves

### Team Roles and Permissions
- 5 roles: owner, admin, customer_support, operations, developer_support
- Permission matrix in `src/lib/teamPermissions.ts`
- `useStore` hook: checks ownership first, then team_members table - all dashboard pages use this
- Team Members page at `/dashboard/team` (Pro-only, max 5 members)
- Invite flow: owner generates a link -> invitee visits `/invite/:token` -> accepts -> added to team_members
- Sidebar filters menu items based on role (e.g. developer_support only sees Dashboard + Settings)
- BillingSection in StoreSettings is owner-only
- AuthPage handles `?redirect=` param for post-login redirect (used by invite flow)

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
