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

### First Sale System
- `product_views` table: anonymous inserts for click tracking; store owners can read their own views
- `FirstSalePanel` component: shown on Dashboard when seller has products; hides when first order detected
  - Progress stats: Product Clicks (from product_views), Orders, Revenue
  - Share panel: Copy link, WhatsApp (auto-checks checklist), Instagram (copies link), Facebook, Snapchat, Download Status Image (canvas-generated PNG)
  - First Sale Checklist: 4 items, persisted in localStorage keyed by store_id
  - Celebration dialog: triggers on first order, shown once (localStorage flag)
- Storefront: tracks view per product click via `product_views` insert; supports `?product=slug` deep links to auto-open a product modal
- Product share URL format: `${origin}/store/${store.slug}?product=${product.slug}`

### Creator Rewards / Affiliate Program
- **Public signup page**: `/partners` - collects name, email, username (becomes ref code), social handle, platform, bank details
- **Referral link format**: `storvo.co/ref/{username}` - handled by `/ref/:username` route (AffiliateRef.tsx)
  - Records click in `affiliate_clicks`, sets `storvo_ref` cookie (30 days) + sessionStorage fallback, redirects to `/auth?mode=signup&ref=username`
- **Auth integration**: AuthPage reads `?ref=` param + cookie, stores in sessionStorage. Optional "Referral Code" field on signup form.
- **StoreSetup attribution**: After store creation, reads sessionStorage `storvo_ref`, looks up affiliate, checks self-referral prevention, creates `affiliate_referrals` record + gives 7-day Pro trial
- **Webhook commission**: `paystack-webhook` auto-records `affiliate_commissions` (30% = ₦1,050) on each Pro payment within 12-month window. UNIQUE(referral_id, period_month) prevents duplicates.
- **Affiliate dashboard**: `/affiliate/dashboard` - shows referral link, clicks, signups, Pro users, monthly/total earnings, payout requests
- **Payout**: Min ₦50,000. Affiliates click "Request Payout" - creates `affiliate_payouts` record. Status: pending/processing/paid
- **Security**: Self-referral check by email, duplicate commission prevented by DB UNIQUE constraint, commissions only after real Paystack payments
- **Migration**: `20260417000007_affiliate_program.sql` - tables: affiliates, affiliate_clicks, affiliate_referrals, affiliate_commissions, affiliate_payouts

### Social Commerce Mode
- Auto-detected via `document.referrer` (checks instagram.com, tiktok.com, facebook.com, snapchat.com, wa.me, t.co, twitter.com, x.com, telegram.org, pinterest.com, youtube.com)
- Fallback: URL params `?ref=` or `?utm_source=` mapped via REF_MAP (e.g. `?ref=ig`, `?ref=fb`, `?ref=wa`)
- When detected: `isSocialMode=true`, `socialSource` set to platform name
- **Social Mode layout** (max-w-lg single column, mobile-first):
  - "Quick checkout enabled" banner at top
  - Product cards: 4:3 aspect image, large product name, large price, Buy Now (full width, brand color, goes direct to checkout), Add to Cart (secondary)
  - Product modal: flex column layout with scrollable content + sticky bottom bar (Buy Now, Add to Cart, Chat on WhatsApp, Share, Make Offer if negotiable)
- **Standard Mode layout**: unchanged 2/3/4 column grid, modal with scrollable buttons
- No database changes required for this feature

### Media Commerce System (migration: 20260417000006_media_commerce.sql)
- `product_videos` table: video files per product (video_url, display_order), public read, owner insert/delete
  - Storage bucket: `product-videos` (public)
- `price_offers` table: buyer negotiation offers (buyer_name, buyer_phone, offered_price, message, status, counter_price, seller_note)
  - Status values: pending, accepted, rejected, countered
  - Public insert (no auth needed), owner can read/update
- `products` table: new columns `is_negotiable` (bool) and `allow_media_download` (bool)
- **ProductImageCarousel** upgraded to `ProductMediaCarousel` - handles both images and videos in unified sorted carousel
  - Video items render with HTML5 `<video controls>` + "Video" badge overlay
  - Optional `allowDownload` prop shows Download button on images/videos; fullscreen has Save button
- **AddProduct + EditProduct**: `is_negotiable` toggle (anyone), `allow_media_download` (Pro only), video upload section (1 free / 4 Pro)
- **Storefront** changes:
  - Product cards show "Negotiable" badge and "Video" tag when applicable
  - Product modal: "Make Offer" button shown when `is_negotiable`, opens offer form (name, phone, offered price, message)
  - Offer is submitted to `price_offers`; success state shown in modal
  - Copy Link button in product modal (product deep link)
  - OG tags updated per-product when modal opens
  - Storefront fetches `product_videos` alongside `product_images`
  - "Sell with Storvo" footer badge (free plan only) with CTA to start a store
- **OffersPage** (`/dashboard/offers`): lists all price offers sorted by date, shows pending count badge
  - Click an offer to open dialog: Accept / Reject / Counter (with counter price + seller note)
  - WhatsApp button on each offer generates contextual message based on status
  - Accepted/countered offers show "Message Buyer on WhatsApp" in dialog
- Sidebar: Offers item added (handshake icon, visible to anyone with orders.view permission)

### Agency Partner Program
- `agency_applications` - anyone can apply (no login required, but user_id linked if logged in)
- `agencies` - approved partners with unique slug (referral code), commission_rate, total_earnings
- `agency_referrals` - links a store to the agency that referred it (UNIQUE on store_id)
- `agency_commissions` - auto-generated via Postgres trigger when a referred store upgrades to Pro
- `/agency/apply` - public application form (AgencyApply.tsx)
- `/agency/dashboard` - tabbed agency dashboard: Overview, My Clients, Earnings, Referral Links (AgencyDashboard.tsx)
- Referral flow: partner link `?partner=slug` -> sessionStorage saves slug -> StoreSetup links agency_referral on store creation
- Commission trigger: `handle_pro_subscription_commission()` fires on subscriptions INSERT/UPDATE, inserts commission + updates agency.total_earnings

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
