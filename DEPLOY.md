# Deployment — remybot.io

This repo deploys to Cloudflare Pages. Every branch gets a preview URL
automatically; `main` is production.

## Environments

| Env | Branch | URL | Supabase project |
|---|---|---|---|
| Production | `main` | https://remybot.io | main (live trade data) |
| Staging    | `staging` | `staging.remybot-io.pages.dev` | main (for now) |
| Preview    | any other branch | `<branch-slug>.remybot-io.pages.dev` | main (for now) |

**Known limitation:** All three environments currently read from the same
Supabase project. Until a separate staging project is provisioned, treat
staging and preview as "UI changes only — do not test writes that touch
production tables from these environments."

## Workflow

### Routine change (feature, bugfix, copy edit)

```
git checkout -b feature/<name>
# ...commit work...
git push origin feature/<name>
# → Cloudflare builds a preview at feature-<name>.remybot-io.pages.dev
# → Click the "View details" link in the PR to open it

# When ready to merge:
gh pr create --base staging --head feature/<name>
# After staging verification at staging.remybot-io.pages.dev:
gh pr create --base main --head staging
```

### Hotfix (production is broken right now)

Skip staging, PR directly into `main` only when:
- Production is actively broken (5xx, broken page, leaked secret)
- The fix is ≤ 20 LOC and touches a single file

```
git checkout -b hotfix/<what>
# ...fix + test locally...
gh pr create --base main --head hotfix/<what> --label hotfix
# After merge, backport to staging so branches don't drift:
git checkout staging && git merge main && git push
```

## Environment variables

Set in Cloudflare Pages → **Settings → Environment Variables**. Scoped
per-environment.

### Production (remybot.io)

| Variable | Purpose | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client Supabase read endpoint | Client bundle |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client Supabase anon key (RLS-protected) | Client bundle |
| `SUPABASE_ANON_KEY` | Server functions (store-math) write key | Server functions |
| `COINBASE_API_KEY_ID` | Futures price proxy auth | Server functions |
| `COINBASE_API_PRIVATE_KEY` | Futures price proxy auth (PEM) | Server functions |
| `KRONOS_HEALTHZ_URL` | Bot /healthz URL for `/api/healthz` proxy (Tailscale / CF Access) | Server functions |

**Security note on `KRONOS_HEALTHZ_URL`:** the bot's `/healthz` binds to
127.0.0.1 on the VPS by design. Expose it to this function via Tailscale
or Cloudflare Access, never via the public internet — the response
includes open-position details (side, entry, stop, TP) and balance.

### Staging / Preview

Mirror Production *except* point `NEXT_PUBLIC_SUPABASE_URL` at a separate
staging Supabase project **once that exists**. Until then, staging
effectively reads production data — document any changes that could write
and route those through Production only.

## Rollback

Cloudflare Pages keeps every deployment. To revert:

1. **Workers & Pages → remybot-io → Deployments**
2. Find the last known-good production build
3. Click **"⋮" → Retry deployment** (or "Rollback to this deployment"
   depending on the current Pages UI)
4. Cloudflare's CDN promotes it globally in ~30 seconds

For git-level rollback (if you need to actually revert code in the repo):

```bash
git revert <bad-commit-sha>
git push origin main
```

## Pre-deploy checklist

Before merging anything to `main`:

- [ ] Preview URL renders without console errors (open DevTools)
- [ ] `npm audit` shows 0 high/critical vulnerabilities
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] Any new env vars added to both Production and Preview in Cloudflare
- [ ] If `functions/api/*` changed: test the endpoint against the preview URL

## Monitoring after deploy

1. Watch the live site for 5 min after deploy
2. Check Cloudflare → Analytics → spike in 4xx/5xx
3. Check browser console on a real visit (DevTools → Console)
4. Verify `/api/btc-price` returns 200 with real price data
5. **Verify `/api/healthz` mirrors the bot's status** — should return 200
   `{status:"ok"|"degraded"}` when bot is up, 503 `{status:"error"|"unreachable"}`
   when bot is down or `KRONOS_HEALTHZ_URL` is misconfigured. This is the
   endpoint `BotHealthCard` polls every 15 s; uptime monitors should
   alert on 503 here.
6. If LiveMathDashboard is on the page, verify `/api/store-math` is inserting
   (Supabase → `live_math_features` table → recent rows)
