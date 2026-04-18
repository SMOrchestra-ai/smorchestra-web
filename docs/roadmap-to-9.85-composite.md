# Roadmap to 9.85 Composite — CSS Surgery Follow-up

**Status:** Deferred as of 2026-04-18.
**Current composite:** 9.78 (A grade, above 9.0 production gate).
**Target composite:** 9.85+ (A grade, stretch quality bar).
**Trigger to execute:** naturally during next CSS/design-token refactor OR when doing a systematic quality push.

---

## Why this doc exists

At HEAD `aa1fd3d` the site scores 9.78 composite. A rigorous re-score (`docs/qa-scores/2026-04-18-post-polish-9.78.md`) identified the exact work required to reach 9.85+. The risk-value analysis concluded **defer** — the +0.07 score delta carries medium visual-regression risk for zero commercial lift, and the time is better spent on GHL-integration commercial work (`docs/ghl-integration-wiring-guide.md`).

**This document captures the full execution path so any future operator can pick it up cold.** No oral history required.

---

## The gap in one paragraph

Commit `e5f60c4` shipped `/assets/site.css` and injected `<link>` tags on 20 pages — but **did not delete** the duplicated CSS rules from each page's inline `<style>` block. Cascade order (inline-after-link) makes this a visual no-op (pages render identically), but architecturally creates two sources of truth with latent token-value disagreements. Closing this gap moves Architecture from 9.6 back to 9.8+ and Engineering from 9.7 to 9.9+ — composite hits 9.85.

---

## Prerequisites

- Repo at clean main with `git rev-parse HEAD` ≥ `aa1fd3d`.
- Playwright harness installed and passing: `npm install && npx playwright install chromium && npx playwright test`. If tests fail on `main`, investigate before starting this work.
- One uninterrupted 60-90 min session. This is per-file surgery; context-switching risks per-page mistakes.

---

## Follow-up 1 — Finish the CSS surgery on 20 linked pages

### Scope

These 20 pages currently link `/assets/site.css` AND duplicate the same rules inline:

**English (10):** `index.html`, `about.html`, `solutions/index.html`, `solutions/ai-revenue-os.html`, `solutions/signal-sales-engine.html`, `solutions/enterprise.html`, `layers/ops.html`, `layers/gtm.html`, `layers/dev.html`, `tools/index.html`.

**Arabic (10):** AR mirrors of the above.

**Deliberately out of scope** (4 pages): `tools/ai-native-readiness/index.html` + AR, `reports/ai-native-readiness-framework.html` + AR. These have self-contained design systems (gold-accent scorecard, light-theme report) and are handled by Follow-up 2 if desired.

### Rules to delete from each page's inline `<style>` block

For every page in the 20-page scope, find and delete:

```css
/* Universal resets — identical everywhere */
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
a{color:inherit;text-decoration:none}
img{max-width:100%;display:block}

/* Layout primitive — identical in 22/22 pages with `.wrap` */
.wrap{max-width:1170px;margin:0 auto;padding:0 clamp(20px,4vw,48px)}

/* Nav structure — 20/20 marketing pages share this exact shape */
.nav{position:sticky;top:0;z-index:50;background:#000;border-bottom:1px solid #1a1a1a}
.nav-inner{display:flex;align-items:center;justify-content:space-between;padding:18px 0;gap:24px}
.brand{display:flex;align-items:center;gap:10px;color:#fff;font-weight:800;font-size:20px;letter-spacing:-0.01em}
.brand-mark{width:34px;height:34px}
.brand-mark img{width:100%;height:100%;object-fit:contain}
.nav-links{display:flex;gap:32px;align-items:center;font-size:14px;font-weight:500}
.nav-links a:hover{color:var(--orange)}
.nav-links a.on{color:var(--orange)}
.nav-cta{padding:10px 18px;background:var(--orange);color:#000;font-weight:700;font-size:13.5px;letter-spacing:.01em;display:inline-flex;align-items:center;gap:8px;transition:.15s}

/* Mobile nav collapse — identical everywhere */
@media(max-width:880px){.nav-links{display:none}}
```

**Caveats per page — read inline `<style>` carefully:**

- Some pages have decorative hover variants like `.nav-cta:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 #fff}` — **keep these** (not in site.css).
- AR pages have RTL-specific tweaks like `[dir="rtl"] .stat{border-left:...}` — **keep these**.
- Some pages override specific properties (e.g., `solutions/signal-sales-engine.html` uses a 1280px `.wrap` max-width, not 1170px). If you find a divergent rule like this, choose:
  - **Option A:** keep the inline override (page intentionally wanted different)
  - **Option B:** reconcile to site.css canonical value (if inline was stale/accidental)
  - When in doubt → Option A.

### Token reconciliation (the hard part)

Several pages declare `:root {...}` tokens that disagree with site.css. Each disagreement needs a decision:

| Token | site.css | Homepage inline | About inline | Resolution |
|---|---|---|---|---|
| `--text-body` | `#cfcfd2` | `#374151` | (not declared) | **?** (probably `#cfcfd2` for dark theme — needs Mamoun eye) |
| `--card` | `#141414` | `#262525` | `#111` | **?** (pick one, update site.css, remove inline) |
| `--text` | `#ffffff` | (implicit) | `#f9fafb` | **?** |

**Decision rule:** grep across the 20 pages for each token name, list all values, pick the most common OR the most design-appropriate, update `site.css` to match, delete all inline overrides.

```bash
# List every --card declaration across the 20 pages:
grep -rn -- '--card:' index.html about.html solutions/*.html layers/*.html tools/index.html \
  ar/index.html ar/about.html ar/solutions/*.html ar/layers/*.html ar/tools/index.html
```

**Important:** if a token truly needs different values on different pages (e.g., a page uses cyan where others use orange), keep the inline `:root` declaration for that specific token only. Remove only the tokens that are the same value everywhere.

### Process discipline

Do this **one page at a time**, not a 20-file blast:

1. Open page 1 (start with `index.html` — most-trafficked, best Playwright coverage).
2. Delete the matching rules from its inline `<style>`.
3. Visually compare before/after locally: open `file://` or `npx serve .` and eyeball the page.
4. Run Playwright: `npx playwright test` (targets the live site after next deploy; for local-only testing: `BASE_URL=http://localhost:8080 npx playwright test`).
5. Commit that single page: `git add index.html && git commit -m "refactor(css): remove site.css-duplicated rules from index.html"`.
6. Push. CI runs Playwright against production post-deploy.
7. Spot-check the live site for visual regression. If clean, move to page 2.
8. Repeat for all 20.
9. Once all 20 are done, reconcile token disagreements in site.css in a final commit.

Total: 20 small commits + 1 token-reconciliation commit. Reviewable, reversible, low-blast-radius.

**Shortcut if confident:** batch EN and AR mirrors together (2 pages per commit, 10 commits total). Still safer than one mega-commit.

### Expected delta

- **Engineering:** 9.7 → 9.9 (real duplication removed, single source of truth established).
- **Architecture:** 9.6 → 9.8 (token disagreements resolved, cascade liability closed).
- **Everything else:** unchanged.
- **Composite:** 9.78 → **~9.85**.

### Byte savings

Per page: ~30-60 lines of CSS × ~40 chars average = 1.2-2.4 KB removed from HTML payload.
Across 20 pages: **24-48 KB** less HTML bytes transferred on first load each page.
After first load, `/assets/site.css` (3.8 KB, cached immutably for 1 year) serves the shared rules.

---

## Follow-up 2 — Mirror the pattern for scorecard + report pages (optional)

If follow-up 1 ships cleanly and appetite remains, extract a second shared stylesheet for the 4 self-contained pages:

### Scope

- `tools/ai-native-readiness/index.html` + AR (gold-accent scorecard design system)
- `reports/ai-native-readiness-framework.html` + AR (light-theme report design system)

### New file

`/assets/diagnostic.css` — contains the shared elements across these 4 pages:

- Light + dark theme switching pattern (if any)
- Gold accent tokens (`--accent:#d4af37`, `--accent-deep:#3d3210`, `--accent-glow`)
- Tier color tokens (`--red:#ef4444`, `--yellow:#eab308`, `--green:#22c55e` AND the lightened variants `#15803d`, `#a16207`, `#b91c1c` for tinted-bg contexts)
- `.tier-badge` base
- `.dim-breakdown` base
- `.score-ring` structural styles (not color — color comes from page-level CSS)
- Print media block from the framework report

### Process

Same discipline as follow-up 1: inject `<link>` first, verify no visual change, then delete duplicated inline rules one page at a time.

### Expected delta

- **Architecture:** +0.05
- **Engineering:** +0.05
- **Composite:** +0.02-0.04 on top of wherever follow-up 1 lands (→ ~9.87-9.89)

---

## Rollback plan

If follow-up 1 causes a visual regression that slips past Playwright:

1. **Per-page rollback:** `git revert <sha-of-that-page-commit>` → redeploys in ~10 seconds via Netlify.
2. **Full rollback:** `git revert aa1fd3d..HEAD` (reverts everything back to the 9.78 state).
3. **Nuclear rollback:** `git reset --hard aa1fd3d && git push --force-with-lease origin main` (ONLY if branch-protection allows and you've coordinated).

The Playwright harness is designed to catch regressions within 30-60 seconds of push. Trust it.

---

## How to re-score after completion

1. `cd` to the repo, verify all 20 pages have been surgically cleaned (grep for the deleted rules should return 0).
2. Run Playwright locally: `BASE_URL=https://smorchestra.ai npx playwright test` — all tests green.
3. Save a new scorecard at `docs/qa-scores/YYYY-MM-DD-composite-<N>.md` using the same format as the existing two scorecards.
4. Optionally invoke the 5-Hat composite scorer (`/score-project` or dispatch a code-reviewer agent with the target-9.85 brief from this doc) to get an independent validation.

---

## Why this was deferred (so future operators don't re-litigate)

From the 2026-04-18 session risk-value analysis (preserved here for reference):

| Factor | Assessment |
|---|---|
| Score delta | +0.07 composite |
| Commercial impact | Zero (no conversion, no SEO, no client-facing polish) |
| Visual regression risk | Medium (token reconciliation is a design call disguised as code cleanup) |
| Time cost | 45-90 min + 2-3 deploy cycles |
| Opportunity cost | High (same time closes form-before-booking or WhatsApp widget — HIGH commercial lift) |
| Urgency | Zero (9.78 is shippable A-grade) |
| Self-solves? | Yes — naturally handled when Sprint 2 GHL wiring touches these pages |

**Decision:** defer. Revisit only if:
- The 9.85 number is going on a client deliverable where it matters exactly.
- You want a systematic design-token refactor anyway.
- You have 90 min of genuinely-uncommitted time before higher-value work queues.

---

*Document owner: quality track. Linked from `docs/qa-scores/2026-04-18-post-polish-9.78.md`.*
*Last updated: 2026-04-18. Rev when executed or when the gap changes shape.*
