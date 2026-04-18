# smorchestra-web

Marketing website for **SMOrchestra** — the AI-Native Business OS install for KSA + UAE B2B scale-ups. Live at [smorchestra.ai](https://smorchestra.ai).

## What this repo is

Static HTML/CSS/JS site with one Netlify Function (scorecard lead capture). Bilingual (EN + AR, RTL lockstep). Deployed to Netlify, auto-build on push to `main`.

## Run locally

No build step. Any static server works:

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .

# Netlify CLI (closest to production — runs functions + redirects)
netlify dev
```

Open http://localhost:8080 (or the port `netlify dev` prints).

## Deploy

Push to `main`. Netlify auto-builds and deploys in ~10-20 seconds. No manual step.

## Structure

```
/                           EN pages (index.html, about.html, tools/, solutions/, layers/, reports/)
/ar/                        AR mirror (same structure, RTL)
netlify/functions/          Netlify Functions (submit-scorecard.js)
_redirects + netlify.toml   Redirect rules (see CLAUDE.md for the 4-file sync rule)
sitemap.xml + robots.txt    SEO
docs/                       Team handoff docs (GHL wiring, env setup, QA scores)
CLAUDE.md                   Project conventions for Claude Code sessions
```

## Critical reading before editing

- **[CLAUDE.md](CLAUDE.md)** — project conventions, the 4-file redirect-sync rule, design tokens, bilingual discipline.
- **[docs/netlify-env-setup.md](docs/netlify-env-setup.md)** — env vars the scorecard function needs (`GHL_CONTENT_ENGINE_PIT`, `GHL_EO_LOCATION_ID`).
- **[docs/ghl-workflow-setup.md](docs/ghl-workflow-setup.md)** — the GHL side of the scorecard lead delivery.
- **[docs/ghl-integration-wiring-guide.md](docs/ghl-integration-wiring-guide.md)** — full GHL integration audit + 3-sprint plan for the marketing team.

## Quality gates

Every PR to `main` should:

1. Not introduce broken internal links (CI checks this via lychee — see `.github/workflows/link-check.yml`).
2. Keep EN + AR in lockstep. If you change content on `index.html`, also update `ar/index.html` in the same commit.
3. Match the design tokens in CLAUDE.md (primary accent `#ff6b35`, Inter + IBM Plex Sans Arabic fonts).
4. Pass the 5-Hat composite score ≥ 9.0. Target 9.8+ for meaningful releases.

## Support

- Issues: https://github.com/SMOrchestra-ai/smorchestra-web/issues
- Email: [hello@smorchestra.ai](mailto:hello@smorchestra.ai)
