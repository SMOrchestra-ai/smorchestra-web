# smorchestra-web — Company Website

## Identity
- **Type:** Static marketing website (HTML/CSS/JS)
- **Hosting:** Netlify (auto-deploy on push to main)
- **Repo:** SMOrchestra-ai/smorchestra-web
- **Branch:** main (direct push, no dev branch)

## Structure
- `/` — English pages (index.html, about.html, tools/, solutions/)
- `/ar/` — Arabic pages (RTL, same structure)
- `_redirects` + `netlify.toml` — Redirect rules for scorecard tools
- `docs/` — Documentation

## Redirect Rules (CRITICAL)
Scorecard tools redirect to production servers:
- `/tools/gtm-fitness` → `https://gtm.smorchestra.ai/matrix`
- `/tools/digital-revenue-score` → `https://score.smorchestra.ai/RevenueOS`

When updating redirects, update ALL of:
1. `_redirects` file
2. `netlify.toml` redirect blocks (EN + AR)
3. JSON-LD structured data in HTML files
4. Any hardcoded CTA links in HTML

## Design
- Colors: Dark theme (#0A0A0A bg, #FF6B00 orange accent)
- Fonts: Inter (body), Cairo (Arabic)
- RTL: `/ar/` pages use dir="rtl"

## Deploy
Push to main → Netlify auto-builds and deploys. No server needed.

## Rules
- No build step — plain HTML/CSS/JS
- Keep EN and AR pages in sync
- Test redirect URLs after any redirect change
- No API keys or secrets in this repo
