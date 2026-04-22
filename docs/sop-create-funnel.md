# SOP — Ship a Funnel (Dynamic Recipe)

**Owner:** Lana Al-Kurd
**Applies to:** `SMOrchestra-ai/smorchestra-web`
**Use this when:** you have a landing page + one or more GHL forms, and you want them wired together on `/test/*` or promoted to production.

---

## How to use this SOP

This is a **copy-paste workflow**, not a theoretical guide. You (Lana) hand an operator (dev / Claude) the **Inputs** listed in §1, the operator runs the **Steps** in §2, and you verify the **Outputs** in §3.

If any input in §1 is missing, the build cannot proceed — don't start.

---

## 1. Inputs you must provide

Fill this template and paste it into the handoff (Telegram / PR comment / chat). Every field is required unless marked optional.

```
FUNNEL HANDOFF
──────────────

Funnel slug (kebab-case):     e.g. signal-gtm, mena-readiness, enterprise-audit
Short description:            one sentence — what does this funnel sell?
Languages:                    EN / AR / both

Landing page source:          [one of]
  (a) Attached HTML file: <paste full HTML or file path>
  (b) Reuse existing template: /test/signal-gtm
  (c) Build from scratch — supply hero copy below

Hero copy (only for option c):
  Badge eyebrow:              e.g. "SIGNAL-BASED GTM FOR MENA"
  Headline:                   with <span class="accent"></span> on the emphasis word
  Subtitle:                   2-3 sentences
  Primary CTA label:          e.g. "Book Your Signal Audit"
  Qualifier line:             e.g. "For B2B SaaS doing $1M+ ARR targeting MENA"

Form embed(s):
  Primary form iframe:        [paste the full <iframe>...</iframe><script>...</script> snippet]
  AR form (if bilingual):     [paste — or "N/A"]
  Form placement:             modal  /  inline  /  both (modal on landing + inline secondary page)

Secondary page (optional):    e.g. /test/questionnaire for an inline-form version
  Form embed for it:          [paste]

Thank-you page:
  (a) Reuse /test/thank-you   — default, sparse, no CTAs
  (b) Custom copy:            [paste headline + body]

On-submit redirect URL:       usually https://smorchestra.ai/test/thank-you
                              (or deploy-preview URL during testing)

GHL workflow — needed?        yes  /  no  (default: yes)
  Notification recipients:    default: mamoun@smorchestra.ai + hello@smorchestra.ai
  Confirmation email:         send to contact?  yes / no. If yes, paste subject + body.
  Branching:                  none / by-company-size / by-tier / other (describe)
  End-state tag:              default: workflow:<slug>-handled

Promotion path (optional):    stays on /test/<slug>? or promote to /<slug>?
                              (affects noindex meta + nav linking)
```

**If any of the above is "I don't know":** stop and decide first. Don't build around ambiguity.

---

## 2. Steps the operator runs

Steps are numbered so you can quote "stuck at §2.4" in a message instead of re-describing the problem.

### 2.1 Validate inputs

- [ ] All §1 required fields present
- [ ] Form iframe has `data-form-id="..."` — extract the ID (used as iframe HTML id + as the sentinel for the modal JS)
- [ ] If bilingual, both form IDs are distinct
- [ ] Landing page HTML (if provided) isn't malware (quick scan: no `eval(`, no obfuscated base64, no unexpected remote script tags)

### 2.2 Create the landing page file

- [ ] Path: `test/<slug>.html`
- [ ] Source depends on input choice:
  - Option (a) — user-supplied HTML: save it **verbatim** first, then layer modifications in §2.5
  - Option (b) — reuse `test/signal-gtm.html`: `cp test/signal-gtm.html test/<slug>.html` then search-and-replace per §2.5
  - Option (c) — from scratch: use `test/signal-gtm.html` as the skeleton, replace hero/problem/pricing/FAQ content with the supplied copy
- [ ] Add `<meta name="robots" content="noindex, nofollow">` if staying on `/test/*`

### 2.3 Add pretty URL to `_redirects`

In the `Test/preview pages` block, append:

```
/test/<slug>    /test/<slug>.html    200
```

If a secondary page was supplied (§1), add its line too.

### 2.4 Wire the form(s)

**Decide placement first based on §1 "Form placement":**

#### If "modal" — on the landing page:

- [ ] Add the modal DOM (backdrop + card + header + iframe container) right before `</body>` — copy the `#signal-audit-modal` block from `test/signal-gtm.html` lines ~1650-1682 and swap the `data-form-id` + `data-real-src` + `title` for the new form
- [ ] Add the modal CSS rules (`.sm-modal*` classes) to the page's `<style>` block
- [ ] Rewire the CTA buttons: find the `ctaButtons.forEach((btn) => btn.addEventListener('click', …))` block and point it at the new modal's open function. Keep the lazy iframe swap + `loadGhlEmbedScriptOnce()` helpers — they belong with the modal, not the form
- [ ] iframe starts as `src="about:blank"` with `data-real-src="<actual GHL URL>"` — the modal JS swaps on first open
- [ ] **DO NOT** add `loading="lazy"` to the iframe — GHL's `form_embed.js` handshake fails on lazy iframes (bug we hit on the newsletter rollout)

#### If "inline" — build a secondary page:

- [ ] New file `test/<slug>-<secondary-name>.html` (e.g. `test/signal-gtm-questionnaire.html`)
- [ ] Use `test/questionnaire.html` as the template — hero + `<section class="form-section">` wrapping the iframe in a `.form-shell` container
- [ ] Paste the iframe verbatim from §1 (including `form_embed.js` script tag right before `</body>`)
- [ ] Add the pretty URL line in `_redirects`

#### If "both" — landing has a modal, secondary page has inline:

- [ ] Do the modal work on the landing page
- [ ] Do the inline work on the secondary page
- [ ] Verify the two pages use **either the same form or intentionally different forms** (see §2.7 on form duplication)

### 2.5 Customize page copy (only for options b/c of §1)

Search-and-replace in `test/<slug>.html`:

| Replace | With | Notes |
|---|---|---|
| `Signal Audit` | The CTA label from §1 | every occurrence — button text, modal header, aria-label |
| `Book Your Signal Audit` | Primary CTA text from §1 | only inside `.btn-primary` text |
| `lC6liig4VJnwRjhEalVB` | New form ID from §2.1 | every occurrence — iframe id, data-layout-iframe-id, data-form-id, data-real-src |
| `Test 1` | `data-form-name` from the new iframe | usually `Funnel · <Slug>` |
| Hero headline | From §1 | preserve `<span class="accent">` markup |
| Hero subtitle | From §1 | |
| Qualifier line | From §1 | |
| `<title>` | `<Funnel Display Name> — SMOrchestra` | |
| Meta description | 1 sentence describing the funnel | |

For option (a) where user supplied the full HTML, do this pass only if the HTML doesn't already match — usually option (a) is already customized.

### 2.6 Decide on the thank-you page

- If "Reuse `/test/thank-you`" — done, no new file needed
- If "Custom copy" — `cp test/thank-you.html test/thank-you-<slug>.html`, update title + eyebrow + H1 + lede to match §1. Add `/test/thank-you-<slug>` line to `_redirects`

### 2.7 Form-in-GHL handoff (Lana does this in GHL, not the operator)

This is the **manual** side — the operator can't touch GHL. Write these steps into the PR body so Lana has a checklist:

- [ ] Open the form(s) in GHL (form ID(s) from §2.1)
- [ ] **Settings → On Submit → Redirect URL:** set to the URL from §1 "On-submit redirect"
- [ ] **Settings → Actions → Add Tag:** static tag `funnel:<slug>`
- [ ] **Settings → Actions → Add Tag:** static tag `source:<slug>-landing` (or whatever traceable attribution matches the funnel)
- [ ] If the form has a qualifier dropdown (company size, tier, topic), add **Conditional Tags** mapping each dropdown value to a tag (e.g. `size:1-10`, `size:11-50`, `topic:enterprise-tier-4`). The workflow uses these for branching.
- [ ] Save + Publish the form

**Duplication check:** if this form is ALSO used on a different funnel or `/contact`, duplicate the form before setting the redirect — otherwise you'll change behavior site-wide. Rule of thumb: one form = one funnel.

### 2.8 Build the GHL workflow (§1 said "yes")

Lana does this in GHL. Operator writes the spec into the PR body:

- [ ] **Automations → Workflows → + Create Workflow → Start from scratch**
- [ ] Name: `Funnel · <Slug> · Submission Handler`
- [ ] **Trigger:** `Contact Tag` with filter `Tag added = funnel:<slug>`
- [ ] **Wait 30 seconds** (lets every tag finish attaching before branching)
- [ ] **Send Internal Notification:**
  - To: recipients from §1 (default `mamoun@smorchestra.ai`, `hello@smorchestra.ai`)
  - Subject: `[Funnel · <Slug>] New submission from {{contact.first_name}} {{contact.last_name}}`
  - Body: include key merge fields + link to contact in GHL UI
- [ ] If §1 requested a confirmation email: **Send Email** action to `{{contact.email}}` with the supplied subject + body
- [ ] If §1 requested branching: **If/Else** on the qualifier tag (e.g. `size:*`), route per §1 description
- [ ] **Add Tag** (final, in every branch): `workflow:<slug>-handled`
- [ ] **Save + Publish** — the toggle top-right must read "Published" (green). Draft = nothing fires. This is the #1 silent failure mode.

### 2.9 Local smoke test

```bash
# With netlify dev running on :8888
http://localhost:8888/test/<slug>
```

- [ ] Page renders, no console errors
- [ ] Every CTA (modal open OR inline visible) works
- [ ] Form submits successfully with a test email (e.g. `lana+funnel-<slug>-test@smorchestra.com`)
- [ ] Redirect goes to the configured thank-you URL

### 2.10 Push + PR

- [ ] Branch: `human/lana/<TASK-ID>-funnel-<slug>` (requires a Linear ticket per `CLAUDE.md`)
- [ ] Commits grouped by topic (one for landing, one for redirects, one for docs if you touched them)
- [ ] PR body includes the §2.7 + §2.8 checklists so Mamoun can verify Lana completed the GHL side
- [ ] Wait for Deploy Preview to go green
- [ ] Test the Deploy Preview URL end-to-end (§2.9 again, but on `deploy-preview-N--smorchestra.netlify.app`)
- [ ] Post PR URL in Telegram to Mamoun

---

## 3. Outputs you verify before approval

### 3.1 Repo changes

- [ ] `test/<slug>.html` exists, renders on Deploy Preview
- [ ] `_redirects` has the new pretty-URL line(s)
- [ ] No absolute URLs to `smorchestra.ai` in same-site CTAs (use relative `/book`, `/contact`, etc. — breaks Deploy Preview testing otherwise)
- [ ] `noindex, nofollow` meta present if under `/test/*`

### 3.2 GHL side (Lana checks manually)

- [ ] Form published (not Draft)
- [ ] Form has `funnel:<slug>` + `source:<slug>-landing` tags configured in Actions
- [ ] On-submit redirect URL matches the new thank-you page
- [ ] Workflow published (not Draft) — top-right toggle is green
- [ ] Workflow Stats page shows ≥1 execution after a test submission with no failures

### 3.3 End-to-end on Deploy Preview

- [ ] Submit a test form with a real inbox you control
- [ ] Contact appears in GHL with expected tags (`funnel:<slug>`, `source:*`, any qualifier tags, eventually `workflow:<slug>-handled`)
- [ ] Internal notification hit `mamoun@` + `hello@` (check both)
- [ ] Confirmation email arrived at test inbox (check Spam folder first time — GHL outbound often starts there)

---

## 4. Concrete example — Signal-GTM funnel (already built)

This is how the template gets filled in practice. Use it as a reference when writing your §1 for a new funnel.

```
FUNNEL HANDOFF — signal-gtm
───────────────────────────

Funnel slug:                  signal-gtm
Description:                  Signal-based GTM for B2B scaleups entering MENA
Languages:                    EN only (for v1)

Landing page source:          (a) Attached HTML file — ~/Downloads/smorchestra-signal-gtm-landing.html
Form embed:
  Primary:                    <iframe src="https://media.smorchestra.com/widget/form/lC6liig4VJnwRjhEalVB" …
  AR:                         N/A
  Placement:                  modal (all 5 .btn-primary + .nav-cta on the landing open it)

Secondary page:               /test/questionnaire (inline Contact Form EN — 5hDy247t9I72C2xsLyX5)

Thank-you page:               (a) Reuse /test/thank-you

On-submit redirect URL:       https://smorchestra.ai/test/thank-you

GHL workflow:                 yes
  Notifications:              mamoun@smorchestra.ai, hello@smorchestra.ai
  Confirmation email:         yes. Subject: "Got your Signal Audit request — Mamoun"
                              Body: per §2.8 template
  Branching:                  by-company-size — Enterprise (51+) → routing:mamoun-direct,
                              SMB (<50) → routing:team, unknown → routing:review
  End-state tag:              workflow:signal-gtm-handled

Promotion path:               stays on /test/signal-gtm until Mamoun validates the positioning
```

Resulting repo paths (all already shipped):

- `test/signal-gtm.html` — landing with modal
- `test/questionnaire.html` — secondary inline page
- `test/thank-you.html` — shared confirmation
- `_redirects` — 3 new lines under `Test/preview pages`

Resulting GHL state (Lana still needs to do):

- Form `Test 1` (`lC6liig4VJnwRjhEalVB`): add `funnel:signal-gtm` tag + set redirect
- Form `Contact Form - EN` (`5hDy247t9I72C2xsLyX5`): **duplicate** first (it's shared with `/contact`), then configure the dup for the funnel
- Workflow `Funnel · Signal GTM · Submission Handler`: build + publish

---

## 5. Common failure modes (quote these in handoffs to save time)

- **F1 — Workflow left in Draft.** Tags apply, nothing else happens. Test submissions look successful but no notifications, no emails, no end-state tag.
- **F2 — Reusing a production form without duplicating.** Setting a redirect on `Contact Form - EN` for a funnel also changes `/contact` behavior site-wide. Always duplicate before diverging.
- **F3 — Missing the `funnel:<slug>` tag.** Workflow trigger matches nothing. Silent failure — no error anywhere.
- **F4 — `loading="lazy"` on GHL iframe.** Handshake fails, iframe stays blank. Remove the attribute (never add it).
- **F5 — Absolute-URL CTA.** `href="https://smorchestra.ai/book"` on a Deploy Preview bounces users out of the preview back to production. Use relative paths (`/book`).
- **F6 — Ambiguity in §1.** If "I don't know" is the answer to any required input, the funnel can't ship. Decide first.

---

## 6. When inputs change mid-build

If Lana hands off the inputs in §1 and then changes them while the operator is mid-build:

- **Copy/positioning changes** → fine, operator updates §2.5
- **Form change (new iframe)** → operator re-does §2.4 (small change; the lazy-swap helpers don't change, only the IDs and URLs)
- **Placement change (modal ↔ inline)** → effectively a new build; discard the current branch work on the relevant page and redo §2.4 under the new pattern
- **Slug change** → rename the file (`test/<old>.html` → `test/<new>.html`), update `_redirects` line, update GHL form redirect URL, update workflow name. Easy if caught early, painful after merge.

---

## 7. Reference files in this repo

- `test/signal-gtm.html` — reference "modal on landing" implementation
- `test/questionnaire.html` — reference "inline form page" implementation
- `test/thank-you.html` — shared confirmation page
- `_redirects` — pretty-URL routing, Test/preview block
- `docs/sop-create-funnel.md` — this file
