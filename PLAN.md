# Kronos Dashboard Improvement Plan

## Context
The remybot-io dashboard works but has a 996-line monolith main page with duplicate navigation, no dark mode, no loading states, and mock data showing inflated stats (82% WR vs real ~40%). Goal: make it professional, maintainable, and honest.

## Phase 1: Kill the Monolith (do first — everything else depends on it)

**Problem:** `page.tsx` has its own sidebar, header, and tab navigation via React state, duplicating the root `Sidebar.tsx` that already routes to `/trading`, `/model`, etc.

**Steps:**
1. Extract reusable components from `page.tsx` into `src/components/`:
   - `StatCard.tsx`, `StatusBadge.tsx`, `ChangelogCard.tsx`
   - `src/components/charts/EquityCurveChart.tsx`, `MonthlyReturnsChart.tsx`, `SkillRadarChart.tsx`

2. Rewrite `page.tsx` (~996 → ~150 lines) as Overview-only:
   - PageHeader + stat cards + equity curve + recent performance + bot status
   - Delete: internal navItems, activeSection state, inline sidebar, inline header

3. Move trapped content to existing route pages:
   - TradingSection → enrich `/trading/page.tsx` (monthly returns, long/short breakdown)
   - ModelSection → enrich `/model/page.tsx` (radar chart, changelog, model config)
   - ResearchSection → enrich `/autoresearch/page.tsx` (experiment roadmap, robustness tests)
   - Wire all pages to `useKronosData()` hook

**Files:** `src/app/page.tsx`, `src/app/trading/page.tsx`, `src/app/model/page.tsx`, `src/app/autoresearch/page.tsx`, new files in `src/components/`

## Phase 2: Dark Mode + Visual Polish

1. Expand `globals.css` with semantic CSS variables + `.dark` class overrides:
   - `--color-surface`, `--color-surface-elevated`, `--color-content`, `--color-content-muted`, `--color-border`
   - Dark values: slate-900 bg, slate-800 cards, slate-100 text

2. Create `src/components/ThemeProvider.tsx` — reads localStorage, toggles `.dark` on `<html>`, provides context

3. Add sun/moon toggle to `Sidebar.tsx` footer

4. Replace all hardcoded `bg-white`, `text-slate-900`, `border-slate-100` with semantic classes (`bg-surface`, `text-content`, etc.)

5. Create `useChartTheme()` hook for Recharts colors (grid stroke, tick fill, tooltip bg)

6. Add subtle card hover effects and page-load fade-in animations

**Files:** `globals.css`, new `ThemeProvider.tsx`, `Sidebar.tsx`, all page files, new `useChartTheme.ts`

## Phase 3: Loading States + Animations

1. Create skeleton primitives in `src/components/Skeleton.tsx`:
   - `SkeletonLine`, `SkeletonCard`, `SkeletonChart` using `animate-pulse`

2. Build page-level skeletons (`OverviewSkeleton`, etc.)

3. Wire into pages via `useKronosData()` hook's existing `loading` state

4. Add `fadeInUp` CSS animation with staggered delays on stat cards

**Files:** new `Skeleton.tsx`, all page files, `globals.css`

## Phase 4: Mock Data Honesty + Branding (can run in parallel with 2-3)

1. Update `mock-data.ts` — zero out live trading stats, keep real experiment results (20.27 bps baseline)
2. Add empty-state UI for pages with no live data ("Research phase — see Autoresearch")
3. Replace default Next.js favicon/assets with Kronos brain icon branding

**Files:** `src/lib/mock-data.ts`, `public/` assets, page files for empty states

## Verification
1. `cd /Users/plpjr/Documents/remybot-io && npm run build` — static export must succeed
2. `npm run dev` — visually check all 6 routes in browser
3. Toggle dark mode — all pages render correctly in both themes
4. Check mobile responsive — sidebar overlay, card stacking
5. Verify no TypeScript errors: `npx tsc --noEmit`
