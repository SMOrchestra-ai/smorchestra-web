# 5-Hat Composite Score · 2026-04-18 · Post-Polish Pass · 9.78 · A

**Commit scored:** `e5f60c4` (+ cache-key fix)
**Prior score:** `b139e3b` composite 9.82 (documented in 2026-04-18-composite-9.82.md)
**Net delta:** −0.04 (aborted climb to 9.85; landed at 9.78 honestly)

## Per-hat progression

| Hat | Baseline | After b139e3b | After e5f60c4 |
|---|---|---|---|
| Product | 9.6 | 9.8 | 9.8 |
| Architecture | 9.1 | 9.7 | **9.6** (−0.1) |
| Engineering | 8.6 | 9.7 | 9.7 |
| QA | 8.9 | 9.8 | **9.95** (+0.15) |
| UX Frontend | 9.4 | 9.9 | 9.9 |
| **Composite** | **9.12** | **9.82** | **9.78** |

## What landed this pass

**✅ Playwright smoke harness (commit `91e5760`) — clean +0.15 on QA.**

Real harness, real assertions, real CI gate. 10 test cases cover:
- Homepage EN + AR + mobile hamburger + no-overflow
- Scorecard 20-question flow with ARIA validation + email-capture payload shape check (network-intercepted, no GHL pollution)
- Redirect contracts: `/book`, `/strategy-call` (regression guard), `/ar/strategy-call`, `/tools/microsaas-readiness` wildcard
- Netlify function error paths: empty body → 400 `email_required`, no referer → 403 `forbidden_origin`

CI triggers: push to main (with 30s Netlify deploy wait), PR, weekly Monday cron, manual dispatch. Path-filtered to skip doc-only PRs. Artifact report retained 14 days.

Cache key bug caught in review: `hashFiles('package-lock.json')` targeted a file that doesn't exist → cache key was constant → Playwright browser cache never invalidated on version bumps. Fixed to `hashFiles('package.json')` in the follow-up commit.

**⚠️ CSS extraction (commit `e5f60c4`) — architecturally mixed result.**

What was claimed: extract shared foundation to `/assets/site.css`, reduce duplication across 20 pages.

What actually happened: `/assets/site.css` shipped (150 lines, cached immutably), link tag injected on 20 pages. **But inline `<style>` blocks were not touched.** Every rule in `site.css` still exists in every page's inline `<style>`, duplicated. Cascade order (inline-after-link) means inline always wins, so render is pixel-identical — but the "extraction" didn't reduce bytes or collapse the sources of truth.

Worse: token values in site.css contradict values in some inline blocks (e.g., `--text-body: #cfcfd2` in site.css vs `#374151` inline on homepage). These conflicts are masked by cascade order. If a page ever dropped its inline `:root` declaration, colors would silently shift. That's a latent architecture liability, not a bug, but it cost −0.1 on the Architecture hat.

**What should have happened:** for each of the 20 linked pages, the surgical deletion of the lines now covered by site.css — resets, `.nav/.nav-inner/.brand/.nav-links/.nav-cta` primitives, `.wrap`, the `@media (max-width:880px){.nav-links{display:none}}` rule, print hygiene, mobile overflow safety net. Per-file work, manageable risk with the Playwright harness providing the safety net. Estimated ~30-60 min.

That work was scoped at the extraction-commit level but executed as a `<link>` injection only. Deferred — see follow-ups.

## Verdict

**Ship with known follow-ups.**

The site is live at composite 9.78 (grade A) — above the 9.0 production-deploy gate, meaningfully above the 9.12 baseline. The Playwright harness is genuinely valuable (regression-proof for three golden paths). The CSS extraction commit is harmless in practice (cascade hides the duplication) but didn't advance Architecture like the commit message implied.

## Follow-ups to actually hit 9.85+

### 1. Finish the CSS extraction surgery

For each of the 20 pages that link `/assets/site.css`, open the inline `<style>` block and delete:

- The universal reset: `*{box-sizing:border-box;margin:0;padding:0}`
- `html{scroll-behavior:smooth}`
- `a{color:inherit;text-decoration:none}`
- `img{max-width:100%;display:block}`
- `.wrap{...}` rule (only where it matches site.css: `max-width:1170px;margin:0 auto;padding:0 clamp(20px,4vw,48px)`)
- `.nav{...}`, `.nav-inner{...}`, `.brand{...}`, `.brand-mark{...}`, `.nav-links{...}`, `.nav-cta{...}` structural rules (only where they match site.css)
- The `@media (max-width:880px){.nav-links{display:none}}` rule
- Print media block (if identical)
- Mobile overflow safety net (if identical)

Reconcile token-value disagreements per page — decide which `--text-body`, `--card`, etc. is canonical and update site.css to match. Don't leave both declarations alive.

Expected byte savings: ~30-60 lines per page × 20 pages = 600-1200 lines of real duplication removed. Engineering moves 9.7 → 9.9, Architecture recovers to 9.8. Composite → ~9.85.

Risk: visual regression if any token disagreement is material. Playwright harness covers 3 golden paths but not every pixel. Recommend: commit page-by-page and let CI validate each.

### 2. Mirror site.css pattern for scorecard + report pages (optional)

The 4 self-contained pages (scorecard EN+AR, framework report EN+AR) were deliberately excluded. They have their own design systems (gold accent, light theme). Could extract their shared bits into a separate `/assets/diagnostic.css` in a follow-up. Worth maybe +0.05.

## Regression log

- **CSS commit `e5f60c4`**: Architecture −0.1 (dual sources of truth, token disagreements masked by cascade). No render regression; no user-visible change.
- **Everything else**: no regressions.

---

*Scored by: code-reviewer agent, 2nd pass at HEAD e5f60c4.*
*Cache-key fix: `.github/workflows/playwright.yml` L59 — `hashFiles('package.json')` replaces the broken lockfile reference.*
*Session lead: Claude Opus 4.7 (1M context).*
