# GHL Integration Wiring Guide — smorchestra-web

**Audience:** Lana + website team. **Scope:** every place GHL is (or should be) wired on the public marketing site. **Goal:** turn the site into a lead-capture + nurture machine without re-architecting it.

GHL tenant in scope: **EO subaccount · Location ID `7IYdMpQvOejcQmZdDjAQ`** (the PIT + env-var setup lives in [docs/netlify-env-setup.md](netlify-env-setup.md)).

---

## 1. Current state — what's wired, what's not

| # | Touchpoint | Status | Notes |
|---|---|---|---|
| 1 | AI-Native Readiness scorecard email capture | ✅ Live | Netlify function → GHL contact with tags. Workflow pending (Lana's first task, see [docs/ghl-workflow-setup.md](ghl-workflow-setup.md)) |
| 2 | `/book` and `/ar/book` (call-booking CTAs) | ⚠️ Direct-to-calendar | 302 force-redirect to `api.leadconnectorhq.com/widget/bookings/core-calendar-sales-calls`. **No qualifier form.** 110 CTAs across 22 pages all route here. |
| 3 | `/strategy-call` (scorecard GREEN-tier CTA) | ⚠️ No page exists | Scorecard links to `smorchestra.ai/strategy-call?source=ai-native-readiness-green` but the route isn't wired. |
| 4 | Contact / inquiry form | ❌ None | Site has ~12 `mailto:hello@smorchestra.ai` and `mailto:mamoun@smorchestra.ai` links. Not tracked. Not tagged. Lost attribution. |
| 5 | Live chat widget | ❌ None | Only Plausible analytics script loads today. |
| 6 | AI chatbot | ❌ None | |
| 7 | WhatsApp Business widget | ❌ None | **Critical gap for MENA** — buyers expect WhatsApp-first contact. |
| 8 | Newsletter signup | ❌ None | No footer or hero capture. |
| 9 | UTM → GHL custom field attribution | ❌ None | `?source=` params exist in links but never land in GHL. Can't report on "which campaign drove the booking." |
| 10 | Conversion pixels / retargeting | ❌ None | No Meta/LinkedIn/Google Ads pixels. |
| 11 | Exit-intent popup | ❌ None | Abandoning traffic is lost. |
| 12 | Session replay / heatmaps | ❌ None | No visual conversion data. |

---

## 2. Priority matrix — where to wire first

Ordered by expected lift per hour of work:

| Rank | Item | Lift | Effort | Who |
|------|------|------|--------|-----|
| 1 | Scorecard workflow + env vars | HIGH | 30 min | Lana (existing ticket) + Mamoun (env vars) |
| 2 | **Form-before-booking** on `/book` + `/ar/book` | HIGH — qualifies leads, prevents calendar ghost-shows | 2 hrs | Lana (embed existing form) |
| 3 | **WhatsApp Business chat** | HIGH — MENA buyers close on WhatsApp | 1 hr | Lana (GHL channel config) + Dev (embed) |
| 4 | **GHL live chat + AI chatbot** | HIGH | 2 hrs | Lana (widget config) + Dev (embed) |
| 5 | UTM → GHL custom fields | MEDIUM — unlocks campaign attribution | 1 hr | Dev (modify Netlify function) |
| 6 | Contact form (replace mailto) | MEDIUM | 1 hr | Lana (form) + Dev (embed) |
| 7 | `/strategy-call` route (fix broken) | MEDIUM — scorecard GREEN CTA is dead | 30 min | Dev |
| 8 | Newsletter footer signup | MEDIUM | 30 min | Lana (form) + Dev (embed) |
| 9 | Exit-intent popup | MEDIUM | 30 min | Lana (GHL popup builder) |
| 10 | Session replay (Clarity/Hotjar) | MEDIUM | 15 min | Dev |
| 11 | Meta + LinkedIn retargeting pixels | LOW (until ad spend) | 30 min | Dev + ads owner |

---

## 3. Item-by-item wiring instructions

### 3.1 — Form-before-booking (Priority 2)

**Current behavior:** any `/book` click → 302 to GHL calendar widget, booking happens with zero context. Sales team gets name + email only.

**Target behavior:** any `/book` click → lands on a qualifier form (existing in GHL from the old site) → on submit → calendar opens pre-filled with the contact info.

**Files that link to `/book` (won't need changes — they all continue to work):**

| File | CTA count |
|------|-----------|
| `index.html` + `ar/index.html` | 10 |
| `layers/{ops,gtm,dev}.html` + AR mirrors | 24 |
| `solutions/{ai-revenue-os,signal-sales-engine}.html` + AR mirrors | 16 |
| `about.html` + `ar/about.html` | 4 |
| `solutions/enterprise.html` + AR | 2 |
| `solutions/index.html` + AR | 2 |
| `tools/index.html` + AR | 2 |
| `reports/ai-native-readiness-framework.html` + AR | 2 |
| **Total** | **~110** |

**Wiring steps (Lana):**

1. Log into GHL → EO subaccount (Location ID `7IYdMpQvOejcQmZdDjAQ`)
2. Sites → Funnels/Forms → locate the existing **pre-call qualifier form** from the old website. If it doesn't exist, create one with these fields (minimum):
   - Name (required)
   - Email (required)
   - Company
   - Role / title
   - Company size (dropdown: `<10`, `10-50`, `50-200`, `200+`)
   - Bucket question: "What best describes your situation?" (dropdown with Tier-3, Tier-4, Early-stage options — matches scorecard tiers)
   - Optional: "What do you want out of this call?" (short text)
3. Form settings → On submit:
   - **Apply tag:** `source:book-form`
   - **Redirect to:** `https://api.leadconnectorhq.com/widget/bookings/core-calendar-sales-calls?prefill=true` (or the existing calendar URL with `?prefill=true` appended so the GHL contact record pre-fills the calendar fields)
4. Copy the **Form Embed Code** — GHL gives you a `<script>` snippet like `<script src="https://link.msgsndr.com/js/form_embed.js" ...></script>`.

**Wiring steps (Dev — 15 min after Lana ships the embed code):**

5. Create two new files:
   - `/book.html` — EN
   - `/ar/book.html` — AR
6. Use this template for `/book.html`:

   ```html
   <!DOCTYPE html>
   <html lang="en" dir="ltr">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1">
     <title>Book a Call · SMOrchestra</title>
     <meta name="description" content="Answer 5 short questions so we can route your call to the right track (Tier-3 Build-Operate-Transfer or Tier-4 Private Briefing). 30 seconds.">
     <meta name="robots" content="noindex,follow">
     <link rel="icon" type="image/png" href="/logo/logo3.png">
     <!-- Match the design tokens of the rest of the site -->
     <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
     <style>
       body{background:#000;color:#cfcfd2;font-family:"Inter",system-ui,sans-serif;margin:0;padding:60px 24px;min-height:100vh}
       .wrap{max-width:720px;margin:0 auto}
       h1{color:#fff;font-size:clamp(28px,4vw,44px);font-weight:900;letter-spacing:-0.02em;margin-bottom:12px}
       p{color:#b8c4d1;font-size:17px;line-height:1.6;margin-bottom:32px;max-width:560px}
       .form-wrap{background:#141414;border:1px solid #262626;border-radius:8px;padding:16px;min-height:500px}
     </style>
   </head>
   <body>
     <div class="wrap">
       <h1>One short qualifier before we book.</h1>
       <p>Five questions · 30 seconds. Once submitted, the calendar opens right below with your info pre-filled. This helps us route you to the right track (Tier-3 install, Tier-4 briefing, or prerequisites engagement).</p>
       <div class="form-wrap">
         <!-- PASTE GHL FORM EMBED CODE HERE (from Lana) -->
       </div>
     </div>
   </body>
   </html>
   ```

   AR version: `<html lang="ar" dir="rtl">`, use IBM Plex Sans Arabic, translate hero + subhead to Gulf Arabic, paste the Arabic form embed (if separate) or same embed with Arabic form variant selected in GHL.

7. Update `netlify.toml` — remove the force-redirect block for `/book`:

   ```toml
   # DELETE this block:
   [[redirects]]
     from = "/book"
     to = "https://api.leadconnectorhq.com/widget/bookings/core-calendar-sales-calls"
     status = 302
     force = true

   # REPLACE with pretty-URL rewrite:
   [[redirects]]
     from = "/book"
     to = "/book.html"
     status = 200
   [[redirects]]
     from = "/ar/book"
     to = "/ar/book.html"
     status = 200
   ```

   Also update `_redirects` — remove the `/book` line (line ~33).

8. Commit, push, deploy. All 110 CTAs now land on the qualifier form.

9. Test: click any `/book` CTA → form renders → submit → calendar loads with prefill. GHL contact appears tagged `source:book-form`.

**Watch out for:**
- GHL's default redirect lands in the same tab. If you want the calendar to open in a new tab (preserves the /book page as a step back), change form settings → submit action → "open redirect in new tab".
- The calendar URL must be the full GHL calendar embed URL, not the short-link. Short-links sometimes drop the prefill params.

---

### 3.2 — WhatsApp Business widget (Priority 3)

**Why first among chat:** in KSA/UAE, most high-intent B2B buyers DM on WhatsApp before they ever fill a form. Skipping this = signal loss.

**Option A — GHL-native WhatsApp channel (inside the unified chat widget, see 3.3):**
1. GHL → Settings → Integrations → WhatsApp Business → connect your verified business number
2. Enable WhatsApp as a channel inside the chat widget (3.3 step 2)
3. Inbound messages route to GHL Inbox with full conversation history

**Option B — Floating WhatsApp-only button (fallback, works without GHL WhatsApp channel):**

Add this before `</body>` on every main page (or ship as one shared snippet via Netlify Edge Function):

```html
<a href="https://wa.me/971XXXXXXXXX?text=Hi%20Mamoun%20—%20I%27m%20on%20smorchestra.ai%20and%20wanted%20to%20ask%20about..."
   target="_blank" rel="noopener"
   style="position:fixed;bottom:24px;left:24px;z-index:9999;width:56px;height:56px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.25);transition:transform .15s"
   aria-label="Chat on WhatsApp"
   onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'">
  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
</a>
```

Update `971XXXXXXXXX` to the actual WhatsApp number (include country code, no `+`).

**RTL placement note:** for AR pages, change `left:24px` → `right:24px`.

**Where to embed:** all main pages except scorecard quiz pages (distracts from quiz) and report pages (delivery assets).

---

### 3.3 — GHL Chat widget + AI chatbot (Priority 4)

**Wiring steps (Lana):**

1. GHL → Sites → Chat Widget → Create / Configure:
   - Business name: `SMOrchestra`
   - Welcome message: "Hey — Mamoun's team. What are you trying to install?" (provocative, on-brand)
   - AR welcome: "أهلاً — أنا من فريق مأمون. وش تبغى تثبت؟"
   - Colors: primary `#ff6b35` (SMO orange), secondary `#000`
   - Business hours: local office hours. Off-hours → AI Employee (if on GHL plan that includes it) or capture-and-callback
   - Channels enabled: Web chat ✓, WhatsApp (if 3.2 Option A configured) ✓, SMS (optional)
2. (If GHL plan includes AI Employee / Conversation AI) → AI Employees → New AI Employee:
   - Persona: "You are Mamoun's first-touch qualifier. Ask what the visitor wants, qualify by company size + tier fit, and route: Tier-3 fit → suggest the AI-Native Readiness scorecard; Tier-4 enterprise → suggest the /book qualifier form; off-scope → collect email, promise 24-hour reply."
   - Escalation: after 3 turns or any message containing "demo / pricing / call" → assign to Mamoun
3. Copy the chat widget **embed snippet** — ends with `js/chat-widget.js` or similar.

**Wiring steps (Dev):**

4. Add the chat widget snippet just before `</body>` on every main page.

   Files to update:
   - `index.html` + `ar/index.html`
   - `about.html` + `ar/about.html`
   - `solutions/index.html` + 3 children (ai-revenue-os, signal-sales-engine, enterprise) + AR mirrors
   - `layers/{ops,gtm,dev}.html` + AR mirrors
   - `tools/index.html` + `ar/tools/index.html`

   **Skip (distraction risk):**
   - `tools/ai-native-readiness/index.html` (quiz pages)
   - `reports/*.html` (delivery assets)
   - `tools/microsaas-readiness/*` (redirect shims)

5. Alternative: inject the chat script globally via a Netlify Edge Function or an include pattern, but given this is static HTML, per-page tags is simplest. Write a little bash helper to insert/update in one pass:

   ```bash
   # Template: find every main .html and inject the chat script before </body>
   for f in index.html about.html solutions/*.html layers/*.html tools/index.html \
            ar/index.html ar/about.html ar/solutions/*.html ar/layers/*.html ar/tools/index.html; do
     if ! grep -q "chat-widget.js" "$f"; then
       sed -i '' 's|</body>|<script src="https://...chat-widget.js"></script>\n</body>|' "$f"
     fi
   done
   ```

6. Commit, push, verify widget renders bottom-right on desktop / floating on mobile.

---

### 3.4 — Fix `/strategy-call` broken route (Priority 7, but quick)

The AI-Native Readiness scorecard results page CTA for GREEN-tier users links to:
`https://smorchestra.ai/strategy-call?source=ai-native-readiness-green`

That route currently 404s (no page + no redirect). Two options:

- **Option A (fastest):** Add a `_redirects` rule → `/strategy-call /book 302` so it funnels through the new form.
- **Option B (better UX):** Build a dedicated page that positions the call as "Private briefing · Tier 4" with slightly different copy + a GHL form variant that pre-tags `tier:green` automatically.

Recommend Option A now, Option B when you build out the tier-specific email variants (see ghl-workflow-setup.md "Follow-ups").

---

### 3.5 — UTM capture into GHL custom fields (Priority 5)

**Current gap:** scorecard CTAs like `?source=ai-native-readiness-framework-email` land the user on the scorecard — but when they submit their email, `source` is not passed to GHL. Campaign attribution is lost.

**Fix (Dev):** modify `netlify/functions/submit-scorecard.js`:

1. Client side (scorecard JS): before submitting, read UTM params from the current URL:
   ```js
   var params = new URLSearchParams(location.search);
   var utm = {
     source: params.get('utm_source') || params.get('source') || '',
     medium: params.get('utm_medium') || '',
     campaign: params.get('utm_campaign') || '',
     referrer: document.referrer || ''
   };
   // add `utm` to the POST body
   ```

2. Server side (Netlify function): extend the tags array with UTM-derived tags:
   ```js
   if (utm.source) tags.push(`utm-source:${slug(utm.source)}`);
   if (utm.campaign) tags.push(`utm-campaign:${slug(utm.campaign)}`);
   ```

3. To go further (GHL custom fields): pull field IDs once via `GET /locations/{locationId}/customFields` with the PIT, add them to the function, and include `customFields: [{id:..., value:utm.source}, ...]` in the upsert payload. See `docs/netlify-env-setup.md` follow-ups.

---

### 3.6 — Contact form (replace `mailto:` links) (Priority 6)

**Current state:** ~12 `mailto:hello@smorchestra.ai` and `mailto:mamoun@smorchestra.ai` links across the site. Not tracked. Not tagged.

**Fix:**

1. Lana → GHL: create a simple "Contact" form (Name, Email, Company, Message). On submit: apply tag `source:contact-form`, redirect to a thank-you page or stay-inline confirmation.
2. Dev → create `/contact.html` + `/ar/contact.html` with the embed, same shell as `/book.html`.
3. Replace mailto links with `href="/contact"` OR keep mailto as a secondary/fallback option and add a primary "Send a message" button that opens the form.

**Pages where mailto is the current primary CTA (fix these first):**
- `solutions/enterprise.html` — Tier 4 private briefing uses `mailto:hello@smorchestra.ai?subject=Private%20Briefing%20Request...`. **Keep** the subject-prefilled mailto as a "prefer email?" fallback, but add a primary form CTA that captures to GHL with `tier:tier-4-private-briefing` tag.
- `index.html` — homepage has "Email Us" buttons. Swap primary → form, keep mailto as footer / secondary.

---

### 3.7 — Newsletter signup (Priority 8)

**What:** single-field email capture in the footer of every main page. Tagged as `source:newsletter`.

**Wiring (Lana):**
1. GHL → Forms → create "Newsletter" form (email only, optional name).
2. On submit: apply tag `source:newsletter` + `newsletter-subscriber`. Redirect to thank-you or inline success.
3. Copy embed code (usually a compact single-line variant).

**Wiring (Dev):** add the embed to the footer of main pages. The current footer has this structure (homepage):

```html
<div class="foot-col">
  <div class="fh">Connect</div>
  ...
</div>
```

Add a new column or row for the newsletter:

```html
<div class="foot-col foot-col-wide">
  <div class="fh">Field Notes · Signal-Based GTM</div>
  <p style="font-size:13px;color:var(--text-muted);margin-bottom:10px">Weekly tactical notes on what's working in MENA B2B. 2-3 minutes. No upsells.</p>
  <!-- GHL NEWSLETTER FORM EMBED -->
</div>
```

---

### 3.8 — Exit-intent popup (Priority 9)

**What:** when a user moves their cursor toward the browser's close/back area OR scrolls up fast, fire a popup offering the scorecard.

**Wiring (Lana, 100% in GHL):**
1. GHL → Sites → Popups → New exit-intent popup.
2. Trigger: exit-intent.
3. Content: "Before you go — take the 8-min AI-Native Readiness Diagnostic. No signup gate. Tells you exactly what to install first." + CTA button to `/tools/ai-native-readiness/`.
4. Frequency: max 1×/session, never on the scorecard itself or the report pages.
5. Copy the tracking snippet — paste once in site footer or add via GTM.

---

### 3.9 — Session replay (Priority 10)

GHL does not provide native session replay. Recommend **Microsoft Clarity** (free, unlimited, zero-perf-impact):

1. https://clarity.microsoft.com → create project → paste site URL.
2. Copy the tracking snippet (one `<script>` tag).
3. Add to all main pages (same pattern as chat widget).
4. Alternative: Hotjar (similar, freemium). Avoid if you're Clarity-allergic.

---

### 3.10 — Retargeting pixels (Priority 11)

Skip until ads budget is active. When ready:
- Meta Pixel — one script tag, fires `PageView` on load, `Lead` on scorecard submit, `Schedule` on booking.
- LinkedIn Insight Tag — one script tag.
- Google Ads global site tag — one script tag.

All three go next to the Plausible snippet. Wire the Netlify function to fire conversion events via client-side events (Meta's `fbq`, LinkedIn's `_linkedin_partner_id`, etc.) once the tags are loaded.

---

## 4. What we need from Lana to proceed

Before Dev can wire anything beyond 3.5 (which is pure code), we need the following from GHL:

| # | Asset | Form ID or URL | Owner |
|---|-------|----------------|-------|
| a | Pre-call qualifier form embed code (EN) | Needs Lana to locate or rebuild from old setup | Lana |
| b | Pre-call qualifier form embed code (AR) | Could be same form with Arabic toggle, or separate | Lana |
| c | Chat widget embed snippet | Needs Lana to configure + copy | Lana |
| d | WhatsApp business number (for fallback widget) | From Mamoun | Mamoun |
| e | AI Employee config (if plan supports) | Needs Lana to spec + configure | Lana |
| f | Exit-intent popup config | Needs Lana to build in GHL | Lana |
| g | Newsletter form embed | Needs Lana to build | Lana |
| h | Contact form embed | Needs Lana to build | Lana |

---

## 5. Suggested sprint plan for Lana

**Sprint 1 (this week, ~4 hours total):**
- [ ] Scorecard workflow + env vars (existing task)
- [ ] Qualifier form embed code delivered to Dev for `/book` + `/ar/book`
- [ ] Chat widget configured and embed code delivered

**Sprint 2 (next week, ~3 hours):**
- [ ] WhatsApp channel enabled in GHL
- [ ] Contact form built, embed delivered
- [ ] Newsletter form built, embed delivered
- [ ] AI Employee / chatbot scripted and activated

**Sprint 3 (week after, ~2 hours):**
- [ ] Exit-intent popup built
- [ ] Tier-specific scorecard email variants (ghl-workflow-setup.md Option 2)
- [ ] UTM custom fields mapped on GHL contact schema (so Dev can wire 3.5 to custom fields not just tags)

---

## 6. Summary — what the finished site looks like when all 12 items are wired

- **Every page** carries a floating GHL chat widget + WhatsApp channel. AI chatbot handles off-hours and first-touch qualifying. Human handoff on intent signal.
- **Every `/book` click** lands on a 5-field qualifier form that pre-tags the contact with tier intent + source, then opens the calendar pre-filled.
- **Every scorecard submission** creates a tagged GHL contact with UTM attribution, triggers the right-language delivery email, and adds the contact to a tier-specific nurture sequence.
- **Every mailto replaced** with a tracked form. Source, campaign, and tier carry through.
- **Every exiting visitor** sees an exit-intent popup offering the scorecard.
- **Every booked call** pre-populated with qualifier answers, so Mamoun knows the tier before he joins.
- **Full-funnel attribution** in GHL: Plausible pageview → scorecard start → scorecard complete (Plausible) → email capture (GHL contact created) → email delivered (GHL workflow) → booking (GHL opportunity) → call outcome (GHL pipeline stage).
- **Session replay** on Clarity confirms the qualitative story behind the quantitative funnel.

That's what "the website is a lead-capture machine" actually means.
