# Vercel Push-to-Live Runbook

Use this runbook when code is pushed but the live site does not reflect changes immediately.

## Baseline Assumptions

- Repository default production branch: `main`
- Vercel project is linked to this repository
- Production URL points to this Vercel project

## Standard Verification After Every Push

1. Push your commit to `origin/main`.
2. Open Vercel Dashboard -> Project -> Deployments.
3. Confirm the latest deployment commit hash matches your local commit hash.

### Commit Match Rule

- If commit hash does **not** match:
  - Treat as trigger/branch issue (wrong branch, missing webhook trigger, or push not on `main`).
- If commit hash **does** match:
  - Treat as cache/build visibility issue (deployment happened, browser/CDN still showing stale content).

## Cache-Safe Client Checks

After deployment is marked ready:

1. Hard reload the page: `Ctrl+Shift+R`
2. Open the same URL in an incognito/private window.
3. Open with version query using current short commit:
   - Example: `https://your-site.vercel.app/?v=e43be83`

If step 3 shows new content but normal open does not, the issue is cache visibility.

## Branch Guardrail (Production Safety)

In Vercel Project Settings:

1. Go to Git settings.
2. Ensure **Production Branch** is set to `main`.
3. Keep team workflow rule: production changes are merged/pushed to `main` only.

## Emergency Fallback (Manual Production Deploy)

Use only when urgent production patch is needed and git-triggered deployment is delayed.

```bash
npx vercel --prod
```

This is an exception path. Normal path should remain: push to `main` -> auto deploy.

## Quick Triage Outcomes

- Deployment not created for latest commit -> trigger/branch issue.
- Deployment failed -> fix build/runtime errors from deployment logs.
- Deployment ready but live looks old -> cache validation steps above.
