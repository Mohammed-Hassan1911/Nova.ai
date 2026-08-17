# Performance Optimization Pass — TRAILHEAD

## Scope
Server-side data-fetching performance + client-side loading-state correctness.
No UI/layout/animation/branding/functionality changes.

---

## Part 1: Server-Side Performance Fixes

### Root Cause
Every authenticated API request paid ~1.4–2.2s in sequential Prisma queries through the remote Supavisor pooler (~600–1100ms each) **before any data was fetched**:
1. `auth()` → jwt callback → `prisma.user.findUnique` (tokenVersion check)
2. `workspaceMember.findFirst` (workspace context)
3. `sweepIfDue()` (overdue invoice sweep on GET routes)

### Changes

| File | Change |
|---|---|
| `src/lib/cache.ts` | **New** — `TTLCache<T>` with configurable TTL, lazy eviction |
| `src/lib/auth.ts` | Cached `tokenVersion` lookup (30s TTL). Exported `invalidateTokenVersionCache()` |
| `src/lib/workspace.ts` | Cached workspace context (30s TTL). Exported `invalidateWorkspaceCache()` |
| `src/app/api/dashboard/route.ts` | Removed `sweepIfDue()` from GET handler |
| `src/app/api/clients/route.ts` | Removed `sweepIfDue()` from GET handler |
| `src/app/api/invoices/route.ts` | Removed `sweepIfDue()` from GET handler |
| `src/app/api/notifications/route.ts` | Removed `sweepIfDue()` from GET handler |
| `src/app/api/auth/reset-password/route.ts` | Calls `invalidateTokenVersionCache()` after password reset |
| `src/app/api/cron/overdue/route.ts` | Cron endpoint (now sole trigger for overdue sweep) |

### Metrics (warm, rounds 2–5 average)

| Route | Before | After | Delta |
|---|---|---|---|
| `/api/dashboard` | 2.1s | 1.0s | **−53%** |
| `/api/clients` | 1.6s | 0.48s | **−70%** |
| `/api/projects` | 2.5s | 0.48s | **−81%** |
| `/api/tasks` | 2.4s | 0.49s | **−80%** |
| `/api/invoices` | 1.7s | 0.49s | **−71%** |
| `/api/notifications` | 1.7s | 0.49s | **−71%** |
| `/api/auth/session` | 0.7s | 6–9ms | **−99%** |
| `/clients` TTFB | 2.6s | 500ms | **−81%** |
| `/projects` TTFB | 2.5s | 500ms | **−80%** |
| `/tasks` TTFB | 2.5s | 520ms | **−79%** |

**Remaining ceiling**: ~500ms per API is the remote Supavisor pooler round-trip. To go faster requires regional DB, connection-pool tuning, or eliminating Prisma for read-heavy paths.

---

## Part 2: Client-Side Loading-State Fixes

### Bug
Pages with `useState([])` + `setLoading(true)` on refetch showed:
- **"No invoices yet" flash** on initial load (Strict Mode abort → `.finally()` sets `loading=false` before second fetch completes)
- **Skeleton flash on every search/filter/page change** (existing data destroyed while refetching)

### Pattern
`hasLoaded` flag distinguishes "still loading for the first time" from "loaded with data (possibly empty)". Skeleton shown only when `!hasLoaded`. Empty state shown only after `hasLoaded && items.length === 0`.

### Files Changed

| File | Bug | Fix |
|---|---|---|
| `src/app/(app)/invoices/page.tsx` | Empty-state flash on load + skeleton on filter | `hasLoaded` flag + abort guard in `.finally()` |
| `src/components/modals/CreateInvoiceModal.tsx` | Navigated away after create | Removed `router.push`, calls `onCreated` then closes |
| `src/app/(app)/projects/projects-view.tsx` | Skeleton on every filter/search/page | `hasLoaded` flag (started `true` since server-preloaded) |
| `src/app/(app)/clients/clients-view.tsx` | Skeleton on every filter/search/page | `hasLoaded` flag + mobile empty-state guard |
| `src/app/(app)/invoices/[id]/page.tsx` | Skeleton after recording payment | `hasLoaded` flag, skeleton only on first load |
| `src/app/(app)/clients/[id]/page.tsx` | Fragile loading pattern | `hasLoaded` flag for robustness |

### Browser Verification (Puppeteer, 8/8 passing)

| Test | Result |
|---|---|
| Hard refresh — no empty-state flash | ✓ |
| Search — no skeleton during refetch | ✓ |
| Filter — no skeleton during refetch | ✓ |
| Create invoice — appears in list immediately | ✓ |
| Detail → back — list with data | ✓ |
| Delete — invoice removed from list | ✓ |
| /clients search — no skeleton | ✓ |
| /projects search — no skeleton | ✓ |

---

## Verification

- `tsc --noEmit` — clean
- `npm run lint` — clean (= tsc)
- `npm run build` — clean production build (32 routes)
- Browser tests — 8/8 passing

## Notes

- Dev server at `:3000`, logs to `/tmp/nova_browser/devserver.log`
- Seed user: `mohammedhassanmail1@gmail.com` / `PerfTest!1`
- Local Postgres on `:5423`, remote Supabase pooler (`eu-west-1`)
- DB tables are tiny (2–4 rows each) — all latency is from the remote pooler, not query complexity
