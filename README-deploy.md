# SMOrchestra — Deploy Guide
**AI-Native Business OS · smorchestra.ai**

This is the operator's manual for getting the site live on Netlify, pointed at the right domain, and wired to GoHighLevel (GHL) for forms, bookings, and nurture.

It is written so a teammate (or future you) can stand this up without pinging Smo or Mamoun.

---

## 0. What lives where

| Layer | Tech | Purpose |
|---|---|---|
| Marketing pages (hub + spokes + pillars) | **Netlify** static hosting | Fast, SEO-optimized, versioned in git |
| Scorecards (webapps) | **VPS** on `score.smorchestra.ai` | Interactive apps (GTM Fitness, Digital Revenue Score) |
| Forms, calendars, nurture, CRM | **GoHighLevel** (GHL) | All lead capture, scheduling, tier-routing |
| DNS | Your registrar (Cloudflare / Namecheap / etc.) | Points apex + subdomain to the right place |

Keep this split. Marketing pages must be instant. Scorecards need server compute. GHL owns the leads.

---

## 1. Netlify — first deploy

### 1a. Link the repo

1. Push the `/website` folder to its own git repo (private is fine). Suggested name: `smorchestra-web`.
2. In Netlify: **Add new site → Import an existing project → GitHub → pick `smorchestra-web`.**
3. Build settings:
   - **Base directory:** *(leave blank — `/website` is the repo root after step 1)*
   - **Build command:** *(leave blank — static site)*
   - **Publish directory:** `.`
4. Click **Deploy site.** First deploy will ship to `something-something.netlify.app`.

### 1b. Custom domain

1. Netlify → **Domain management → Add custom domain → `smorchestra.ai`.**
2. Add `www.smorchestra.ai` too (it will redirect to apex via `netlify.toml`).
3. At your DNS registrar:
   - `A` record: `smorchestra.ai` → Netlify's load balancer IP (Netlify shows it during setup: `75.2.60.5`)
   - `CNAME`: `www.smorchestra.ai` → `<your-site>.netlify.app`
   - Leave `score.smorchestra.ai` pointing to your VPS — that subdomain is not served by Netlify.
4. In Netlify → **HTTPS → Provision certificate.** Let's Encrypt auto-renews.

### 1c. Verify the config files are doing their job

After the deploy succeeds, hit these URLs and confirm:

- `https://smorchestra.ai/` → renders the hub (status 200)
- `https://www.smorchestra.ai/` → 301 redirects to `https://smorchestra.ai/`
- `https://smorchestra.ai/robots.txt` → plain text, includes the sitemap line
- `https://smorchestra.ai/sitemap.xml` → XML, lists all pillars + solutions + cohorts
- `https://smorchestra.ai/book` → 302 redirects to the GHL calendar
- `https://smorchestra.ai/tools/gtm-fitness` → 302 redirects to `score.smorchestra.ai/gtm-fitness`
- `https://smorchestra.ai/smorchestra-home-ghl` → 301 redirects to `/layers/gtm` (SEO equity carry-forward)

If any of these fail, the source of truth is `netlify.toml`. `_redirects` is a fallback.

---

## 2. DNS map (final state)

```
smorchestra.ai           A         Netlify apex IP
www.smorchestra.ai       CNAME     <site>.netlify.app
score.smorchestra.ai     A         <VPS IP>             (scorecards — unchanged)
mail MX + DKIM + SPF     (unchanged — keep email routing as-is)
```

**Do not** move `score.` to Netlify. Those are interactive webapps — they stay on the VPS. Netlify just aliases clean `/tools/*` URLs to them.

---

## 3. GoHighLevel wiring (Phase 1D)

These are the touchpoints between Netlify pages and GHL. Configure in this order:

### 3a. Custom fields (Location → Settings → Custom Fields)

Create these at the **contact** level so score-tier routing works:

| Field name | Type | Purpose |
|---|---|---|
| `gtm_fitness_score` | number | From scorecard 1 |
| `gtm_fitness_tier` | dropdown (A/B/C/D) | Derived tier |
| `digital_revenue_score` | number | From scorecard 2 |
| `digital_revenue_tier` | dropdown (A/B/C/D) | Derived tier |
| `source_page` | text | Which spoke captured them |
| `lead_magnet` | text | Which asset they downloaded |

### 3b. Tags

Apply automatically via workflow triggers:

- `tier-a`, `tier-b`, `tier-c`, `tier-d`
- `source-{ai-revenue-os, signal-sales-engine, mena-expansion, cohort-gtm-founders, cohort-ai-revenue-ops, hub}`

### 3c. Webhooks (scorecard → GHL)

Each scorecard posts results to a GHL inbound webhook. Wire in the scorecard app's `.env`:

```
GHL_WEBHOOK_GTM_FITNESS=https://services.leadconnectorhq.com/hooks/<id>
GHL_WEBHOOK_DIGITAL_REVENUE=https://services.leadconnectorhq.com/hooks/<id>
```

Webhook payload creates/updates the contact, sets the score + tier custom fields, applies the right tag, and triggers the nurture workflow.

### 3d. Calendar

- Create a GHL calendar called **"Strategy Call — SMOrchestra"** (30 min, Mamoun).
- Copy the booking widget URL.
- Update `netlify.toml` → the `/book` redirect target to that exact URL.
- Redeploy Netlify (just a commit bump — it re-reads `netlify.toml`).

### 3e. Forms embedded on spokes

For each solution/cohort spoke, embed a GHL form via iframe. Template:

```html
<iframe
  src="https://api.leadconnectorhq.com/widget/form/<FORM_ID>"
  style="width:100%;height:640px;border:none;"
  id="inline-<FORM_ID>"
  data-layout="..."
  data-trigger-type="alwaysShow"
  data-deactivation-type="neverDeactivate"
  data-form-name="<NAME>"
  data-height="640"
  data-layout-iframe-id="inline-<FORM_ID>"
  data-form-id="<FORM_ID>"
  title="<NAME>"
></iframe>
<script src="https://link.msgsndr.com/js/form_embed.js"></script>
```

Each spoke sets its own `data-form-name` and pipes `source_page` in hidden field prefills.

---

## 4. Content update workflow

1. Edit HTML in `/website/` on a branch.
2. Push. Netlify auto-builds a **Deploy Preview** on any PR.
3. Review the preview URL, merge to `main`, production deploys in ~20 seconds.
4. If you broke something, Netlify → **Deploys → pick the previous one → "Publish deploy"** — instant rollback.

When you add a new spoke or pillar:

1. Create the file under `/website/solutions/` or `/website/layers/` or `/website/cohorts/`.
2. Add the pretty-URL redirect to `netlify.toml` (`/solutions/<slug>` → `/solutions/<slug>.html`).
3. Add the URL to `sitemap.xml`.
4. Link it into the hub nav + footer.
5. Ping Google Search Console → "Request indexing" on the new URL.

---

## 5. SEO checklist (do this on every new page)

- [ ] Unique `<title>` (≤60 chars, brand at end: `... | SMOrchestra`)
- [ ] Unique `<meta description>` (150–160 chars)
- [ ] `<link rel="canonical" href="https://smorchestra.ai/<path>" />`
- [ ] OG + Twitter tags (title, description, image)
- [ ] JSON-LD: `Service` or `Course` or `FAQPage` as appropriate (+ `BreadcrumbList` on all deep pages)
- [ ] `<h1>` used exactly once, reflects the primary keyword naturally
- [ ] Internal link up to hub + sideways to 2 related spokes
- [ ] Image `alt` text on every `<img>`
- [ ] Added to `sitemap.xml`
- [ ] Lighthouse performance ≥ 90, accessibility ≥ 95 before merging

---

## 6. Monitoring

- **Google Search Console:** verify `smorchestra.ai` via DNS TXT record. Submit sitemap.
- **Google Analytics 4 / Plausible:** install via the `<head>` — one line each, globally.
- **Netlify Analytics** (paid add-on, $9/mo): server-side, bot-free numbers. Worth it once traffic matters.
- **GHL reporting:** lead → tier → booked → closed funnel.

---

## 7. Known gaps (post-W3)

- Proper favicon set (`.ico`, 16/32/180) instead of the `logo3.png` fallback.
- `/book` + `/ar/book` now serve local Pre-Call Qualifier form pages (`book.html` / `ar/book.html`, 2026-04-20). The GHL form's "After submit" action forwards qualified leads to SMOrchestra's own calendar widget: `https://media.smorchestra.com/widget/booking/3QV2chBXjKpkQya7UcSM` (location `UNw9DraGO3eyEa5l4lkJ`, SMOrchestra subaccount). The old EO-calendar 302 (`api.leadconnectorhq.com/widget/bookings/core-calendar-sales-calls`) has been removed from `netlify.toml` + `_redirects`.
- Scorecard subdomain apps (`score.smorchestra.ai/gtm-fitness`, `/digital-revenue-score`) — the marketing site links to them and the sitemap lists them, but the webapps live on the VPS independently.

**Closed in W1–W3 (2026-04-15):**
- OG images: all 9 live pages have custom 1200×630 assets in `/assets/og/` (hub default + pillars + solutions + cohorts).
- Pillar pages shipped: `/layers/ops`, `/layers/gtm`, `/layers/dev` — full hero, fit gate, BOT, FAQs, JSON-LD.
- `/tools/` landing shipped with CollectionPage + two SoftwareApplication schemas.
- Font Awesome eliminated; custom SVG sprite at `/assets/icons.svg` (29 symbols).
- Plausible + preconnects + `prefers-reduced-motion`-aware reveal CSS on all 10 live pages.

---

**Last updated:** 2026-04-15 · W1–W3 shipped. Ready for production deploy.
