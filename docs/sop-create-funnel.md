# SOP — Create a Funnel (Landing + Form + Thank-You + Workflow)

**Owner:** Lana Al-Kurd
**Last updated:** 2026-04-22
**Applies to:** SMOrchestra-ai/smorchestra-web
**Scope:** The repeatable pattern for shipping a standalone funnel on `smorchestra.ai/test/*` (or promoted to `/` later). Covers everything from GHL form config to post-submit workflow.

---

## What a "funnel" means here

A funnel in this repo is a **3-page + 1-workflow unit**:

```
   (Landing page)              (Form)                    (Thank-you)
   /test/<name>       →        GHL iframe        →       /test/thank-you
   ─ hero + CTAs              ─ modal OR inline         ─ confirmation
   ─ dark theme               ─ captures contact        ─ zero CTAs
   ─ multiple CTAs
                                     │
                                     ▼
                            (GHL Workflow fires on tag)
                            ─ notify Mamoun + team
                            ─ apply contact tags
                            ─ optional: send email
                            ─ optional: add to sequence
```

**Reference implementation:** `/test/signal-gtm` (already shipped) — use it as the copy-paste template for any new funnel.

---

## Naming + path conventions

| Piece | Where | Naming rule |
|---|---|---|
| Landing page file | `test/<slug>.html` | kebab-case, matches funnel topic (`signal-gtm`, `enterprise-audit`, `mena-readiness`) |
| Thank-you page | `test/thank-you.html` (shared) OR `test/thank-you-<slug>.html` (if custom copy needed) | prefer shared unless a specific funnel needs different copy |
| Pretty URL rewrite | `_redirects` | `/test/<slug>` → `/test/<slug>.html` (200, not 301) |
| GHL form | GHL → Sites → Forms | `Funnel · <Slug> · EN` (and `· AR` for bilingual) — so form lists stay grouped |
| GHL workflow | GHL → Automations → Workflows | `Funnel · <Slug> · Submission Handler` — same prefix as the form |

Keep `/test/*` for preview/unreleased funnels. When a funnel is approved, rename (see §8).

---

## 1. Build the GHL form

Before any HTML work.

### 1.1 Create the form

1. `salesmfast.smorchestra.ai` → **Sites → Forms → + Add Form → Start from Scratch**
2. Name it `Funnel · <Slug> · EN` (e.g. `Funnel · Signal GTM · EN`)
3. Fields — match the funnel's qualifier logic. For signal-gtm the minimum is:
   - First name (required)
   - Last name (required)
   - Email (required)
   - Company (required)
   - Company size — dropdown (1-10 / 11-50 / 51-200 / 200+)
   - Role/title
   - Free-text "What are you trying to solve?"
4. Remove the default SMS-consent checkboxes (not relevant to this funnel).

### 1.2 Form actions (every funnel)

**Settings → Actions:**

- **Add Tag (static):** `funnel:<slug>` (e.g. `funnel:signal-gtm`)
- **Add Tag (static):** `source:<slug>-landing` (traceable attribution)
- **Conditional tags** (if the form has a "company size" or similar qualifier dropdown): add a tag like `size:1-10`, `size:11-50`, etc. The workflow uses these for branching.

### 1.3 Form styling (every funnel, to match the dark site)

**Styles → Form:**
- Form width: 100% (container handles the max-width)
- Background: transparent
- Border radius: 8px
- Corner radius inputs: 6px

**Styles → Input Field:**
- Font color: `#101828`
- Border: 1px `#D0D5DD`
- Background: `#FFFFFF` (keep form inputs light — the modal wraps them in a dark frame)

**Styles → Submit Button:**
- Background: `#FF6600` (accent)
- Hover: `#CC5200`
- Text: `#000000`
- Font weight: 700

### 1.4 On-submit redirect

**Settings → On Submit → Redirect URL:**
```
https://smorchestra.ai/test/thank-you
```
(or `https://deploy-preview-<N>--smorchestra.netlify.app/test/thank-you` during preview testing)

> **If the same form is reused on multiple pages (e.g. `/contact` AND `/test/questionnaire`):** setting a redirect applies site-wide. If you need a per-funnel thank-you, **duplicate the form in GHL** instead of reusing it. Keep one "production" copy with no redirect (shows inline confirmation) and one "funnel" copy with the redirect.

### 1.5 Grab the embed snippet

**Integrate → Copy Embed Code.** Paste it into the repo in §2.

---

## 2. Build the landing page (`test/<slug>.html`)

Copy `test/signal-gtm.html` as a starting template. It already includes:

- Dark theme (black background, orange `#FF6600` accent)
- Inter font loaded from Google Fonts
- Sticky nav with "Back to site" link
- Hero, stats bar, problem, how-it-works, signals, channels, results, pricing, qualifier, FAQ, final CTA, footer — in that order
- **Signal-audit modal wiring** (lazy iframe swap + `form_embed.js` injection on first open + Esc/backdrop/× close + sessionStorage-safe)
- `noindex, nofollow` meta (preview only)

### 2.1 Customize for the new funnel

Search-and-replace the following strings in your new `test/<slug>.html`:

| Replace | With |
|---|---|
| `Signal Audit` | The CTA label your funnel uses (e.g. `Readiness Audit`) |
| `Book Your Signal Audit` | The primary CTA button text |
| `lC6liig4VJnwRjhEalVB` (iframe form ID) | Your new form's ID from §1.5 |
| `Test 1` (data-form-name) | Your form name from §1.1 |
| Hero headline + subtitle | Funnel-specific copy |
| Stats, problem cards, signals, pricing | Funnel-specific content |
| `<title>` + meta description | Funnel-specific SEO |

### 2.2 Modal vs inline — pick one pattern

**Modal** (recommended for landing pages with many CTAs):
- All `.btn-primary` and `.nav-cta` open the modal
- iframe is lazy-loaded (starts at `about:blank`, swaps to real URL on first open)
- Keeps the landing page fast and scannable

**Inline** (better for pages where the form IS the primary content, e.g. `/test/questionnaire`):
- iframe sits in a `<section>` directly on the page, above the fold
- No JS required beyond `form_embed.js`

Never mix both on the same page.

### 2.3 Add the pretty URL

`_redirects` (after the existing `/test/*` lines):

```
/test/<slug>    /test/<slug>.html    200
```

---

## 3. Build/reuse the thank-you page

If the shared thank-you (`test/thank-you.html`) is fine — done. Skip to §4.

If you need custom thank-you copy (e.g. different reply-time promise, specific next-step instructions), copy `test/thank-you.html` to `test/thank-you-<slug>.html` and update:

- `<title>`
- Eyebrow text
- H1
- Lede paragraph

Keep the same visual language (checkmark, dark theme, orange accent, zero CTAs). Then update the GHL form's redirect URL (§1.4) to point at the slug-specific URL and add a `_redirects` line for it.

---

## 4. GHL workflow — fires when the form is submitted

**This is the step Lana most often forgets. Do not ship a funnel without it.**

### 4.1 Create the workflow

1. GHL → **Automations → Workflows → + Create Workflow → Start from scratch**
2. Name: `Funnel · <Slug> · Submission Handler`

### 4.2 Trigger

- **Trigger type:** `Contact Tag`
- **Filter — Tag added:** `funnel:<slug>` (the tag you set in §1.2)

The workflow fires the moment GHL applies the funnel tag — i.e. right after form submission.

### 4.3 Wait step

Add `Wait · 30 seconds` immediately after the trigger. This lets every tag the form writes (`source:*`, `size:*`, any conditional topic tags) finish attaching before the workflow branches. Without this you can hit race conditions.

### 4.4 Internal notification (always)

**Action: Send Internal Notification / Email Team**

- **To:** `mamoun@smorchestra.ai`, `hello@smorchestra.ai`
- **Subject:** `[Funnel · <Slug>] New submission from {{contact.first_name}} {{contact.last_name}}`
- **Body:** include every merge field you care about:
  ```
  Company: {{contact.company_name}}
  Email: {{contact.email}}
  Role: {{contact.custom_field.role}}
  Size: {{contact.custom_field.company_size}}
  Problem: {{contact.custom_field.problem}}

  Contact: https://salesmfast.smorchestra.ai/v2/location/UNw9DraGO3eyEa5l4lkJ/contacts/detail/{{contact.id}}
  ```

### 4.5 Contact confirmation email (optional but recommended)

**Action: Send Email**

- **From:** `Mamoun Alamouri <mamoun@smorchestra.ai>`
- **To:** `{{contact.email}}`
- **Subject:** depends on the funnel. For signal-gtm: `Got your Signal Audit request — Mamoun`
- **Body (signal-gtm example):**
  ```
  Hi {{contact.first_name}},

  Got your questionnaire. Quick look:

  ─ Company: {{contact.company_name}}
  ─ Size: {{contact.custom_field.company_size}}

  I'll review this today and reply within 24 hours with either
  (a) a 30-minute Signal Audit slot, or (b) a note saying we're not
  a fit right now and why.

  If it's more urgent, just reply to this email with a number and
  I'll call.

  — Mamoun
  SMOrchestra.ai · Dubai
  ```

### 4.6 Branching (optional — tier/size routing)

If the form has a company-size or qualifier dropdown (§1.2 conditional tags), add an `If/Else` after §4.5:

- **Branch A — Enterprise:** `size:51-200` or `size:200+` → also add tag `routing:mamoun-direct` → notification goes to Mamoun only (not the team alias)
- **Branch B — SMB:** `size:1-10` or `size:11-50` → tag `routing:team` → notification goes to `hello@` (team handles first pass)
- **Branch C — Unknown/no size:** tag `routing:review` → Mamoun reviews manually

### 4.7 End-state tag

Final action in every branch:

- **Add Tag:** `workflow:<slug>-handled` (so you can query "how many funnel submissions did we process?" later)

### 4.8 Save + Publish

**⚠️ Workflows in Draft do NOT fire.** Toggle to **Published** (green) in the top right. If you see "Draft" (grey), nothing happens on submission — you will silently lose every lead.

---

## 5. Test end-to-end (before handing to Mamoun)

### 5.1 Local

```bash
# With netlify dev running on :8888
http://localhost:8888/test/<slug>
```

1. Land on the page.
2. Click every `.btn-primary` and `.nav-cta` — confirm modal opens (or inline form is visible).
3. Submit with a test email (`lana+funnel-<slug>-test@smorchestra.com`).
4. Confirm redirect to `/test/thank-you` works.

### 5.2 Deploy Preview

Push the branch → Netlify builds `deploy-preview-<N>--smorchestra.netlify.app`.

Repeat steps above on the preview URL. This is the URL you give Mamoun for review.

### 5.3 GHL side

After a test submission:

1. GHL → **Contacts** → find `lana+funnel-<slug>-test@smorchestra.com`
2. Verify tags present:
   - `funnel:<slug>` ✓
   - `source:<slug>-landing` ✓
   - `size:*` (if qualifier used) ✓
   - `workflow:<slug>-handled` (after ~90 s) ✓
3. Verify the internal notification hit `mamoun@` + `hello@`
4. Verify the contact-confirmation email reached the test inbox (check Spam folder the first time — GHL outbound often starts there until the sending domain is warmed)
5. GHL → **Automations → Workflows → [your workflow] → Stats**: execution count should be ≥1 with no failures

If any step fails, the workflow's **Execution Log** (GHL shows it under Stats → click the run) tells you which action choked.

---

## 6. Hand off to Mamoun

When ready to merge:

1. Push the branch (branch naming per `CLAUDE.md`: `human/lana/SSE-XXX-funnel-<slug>` — requires a Linear ticket)
2. Open a PR against `main` with this checklist in the body:
   - [ ] Form created in GHL and published
   - [ ] Landing page renders on Deploy Preview
   - [ ] Thank-you redirect works
   - [ ] Workflow is **Published** (not Draft) and fires on test submission
   - [ ] Internal notification received at `mamoun@` + `hello@`
   - [ ] Contact-confirmation email delivered (not in Spam)
   - [ ] `noindex` meta on landing page (if under `/test/`)
3. Post the PR URL in Telegram to Mamoun
4. Wait for his review + merge. **Do not self-approve** (CLAUDE.md hard rule).

---

## 7. Specific workflow — Signal GTM (`/test/signal-gtm`)

Parameters for the workflow that should be built right now.

| Setting | Value |
|---|---|
| GHL form | `Test 1` (ID `lC6liig4VJnwRjhEalVB`) |
| Landing page | `test/signal-gtm.html` at `/test/signal-gtm` |
| Thank-you | shared `/test/thank-you` |
| Workflow name | `Funnel · Signal GTM · Submission Handler` |
| Trigger tag | `funnel:signal-gtm` |
| Sender email | `mamoun@smorchestra.ai` |
| Internal notify | `mamoun@smorchestra.ai`, `hello@smorchestra.ai` |
| Confirmation email body | §4.5 template above |
| End-state tag | `workflow:signal-gtm-handled` |

**First action Lana must take in GHL right after reading this SOP:**
1. Open Test 1 form → Settings → Actions → **add tag `funnel:signal-gtm`** (currently missing)
2. Settings → On Submit → Redirect URL → **set `https://smorchestra.ai/test/thank-you`**
3. Build the workflow per §4
4. Publish the workflow

Without step 1, the workflow's trigger will never fire. Without step 2, the visitor lands on a blank post-submit state.

---

## 8. Promoting a funnel out of `/test/`

When a funnel is validated and ready for production (linked from main nav, indexed by Google):

1. Move the file: `test/<slug>.html` → `<slug>.html` (or `solutions/<slug>.html`)
2. Remove the `noindex, nofollow` meta
3. Update `_redirects`: remove the `/test/<slug>` line, add `/<slug> → /<slug>.html 200`
4. Update the GHL form's on-submit redirect to the new URL
5. Update the GHL workflow's internal notification / confirmation email copy (remove any "preview" language)
6. Link the funnel from the main nav + relevant footer columns
7. Decide: keep `/test/<slug>` as a 301 → new path (preserves any shared links), or let it 404

---

## Common mistakes (avoid)

- **Workflow left in Draft.** Leads submit, tags apply, nothing else happens. Nobody notices until a stakeholder asks why replies never went out.
- **Reusing a production form without duplicating.** You set a redirect on Contact Form EN to test a funnel thank-you, and suddenly `/contact` on production also redirects. Always duplicate before diverging.
- **Missing the `funnel:<slug>` tag.** Without it the workflow trigger matches nothing. Easy to forget because GHL form Actions are in a different tab from Workflow triggers.
- **Forgetting `loading="lazy"` on inline iframes is harmful here.** GHL's `form_embed.js` handshake fails on lazy iframes (they stay blank). We hit this on the newsletter rollout. On `/test/*` pages we don't use `loading="lazy"` on GHL iframes — keep it that way.
- **Hard-coded absolute URLs in CTAs.** We hit this when a "Book a Strategy Call" button used `https://smorchestra.ai/book` — on Deploy Preview it bounced users out of the preview to production (which served the old behavior). Always use relative paths (`/book`) in the same-site CTAs.

---

## Quick reference — files this SOP creates

For each funnel named `<slug>`:

```
test/<slug>.html                 ← the landing page
test/thank-you.html              ← shared confirmation (exists already)
_redirects                       ← pretty URL additions (2-3 lines)
docs/sop-create-funnel.md        ← this file (one-off)
```

In GHL:
- 1 Form per language (usually just EN at preview stage)
- 1 Workflow
- Tags: `funnel:<slug>`, `source:<slug>-landing`, `workflow:<slug>-handled`
