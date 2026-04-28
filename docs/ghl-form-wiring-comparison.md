# GHL Form Wiring — Comparison

**Purpose:** when a new lead-capture surface is proposed, decide between the two wiring approaches we actually use in this repo. Scored using Mamoun's 3-dimension rubric (see [ghl-integration-wiring-guide.md §7](ghl-integration-wiring-guide.md)).

**Date:** 2026-04-21

---

## The two approaches

### Option A — GHL native form, embedded

Form is built inside GoHighLevel. GHL produces an iframe embed. We drop the iframe into an HTML page on this repo. Submission goes straight from the user's browser to GHL — our server never sees the payload.

**Live example in this repo:** [book.html:136-149](../book.html)

```html
<iframe
  src="https://media.smorchestra.com/widget/form/jkk3BB6DWIfvBdsVHLAk"
  data-form-name="Pre-Call Qualifier"
  data-form-id="jkk3BB6DWIfvBdsVHLAk"
  title="Pre-Call Qualifier"></iframe>
```

**Also used by:** `contact.html`, `ar/book.html`, `ar/contact.html`, newsletter footer embed.

**Data path:** `user browser → media.smorchestra.com (GHL) → GHL contact record`

### Option B — Custom form in code + webhook/API call on submit

Form is built in HTML/JS on our page. On submit, JS posts to a Netlify function. The function validates, adds server-side data (score, UTM parsing, tag logic), then calls the GHL Contacts API with a server-held PIT token.

**Live example in this repo:** [tools/ai-native-readiness/index.html](../tools/ai-native-readiness/index.html) (form) → [netlify/functions/submit-scorecard.js](../netlify/functions/submit-scorecard.js) (handler) → `https://services.leadconnectorhq.com/contacts/upsert`

**Data path:** `user browser → our page (HTML/JS) → /.netlify/functions/submit-scorecard → GHL Contacts API → GHL contact record`

Note: this is not literally a GHL *inbound* webhook — it's our function calling GHL's API. Same class of pattern: code-owned form, server-mediated relay. For a true GHL inbound webhook (GHL → us), the shape would be a Netlify function that *receives* a POST from a GHL workflow; we don't currently use that direction.

---

## Side-by-side

| Concern | Option A — GHL native embed | Option B — Custom form + function/webhook |
|---|---|---|
| Where the form lives | Inside GHL (form builder) | In this repo (HTML/JS) |
| Where validation runs | GHL | Our Netlify function (re-validate server-side) |
| Who has the PIT token | GHL — token not needed | Us — lives in Netlify env vars only |
| Custom fields easy? | Yes (GHL form builder UI) | Yes (but we write the code) |
| Server-side computed data (scores, derived tags)? | No | Yes (this is why scorecard uses Option B) |
| Conditional logic / multi-step / scoring? | Limited to what GHL form builder supports | Arbitrary |
| Styling matches our site? | iframe — limited; some CSS via GHL theme | Full — it's our HTML |
| Works with RTL / Arabic out of the box? | Depends on GHL config; we have AR form IDs live | Yes — we control the markup |
| Works offline / with bad network? | No (iframe must load) | Page works; submit will fail until back online |
| Who can change the form? | Lana in GHL, no PR | Requires a PR |
| Change is auditable in git? | No | Yes |
| Spam defense | GHL built-in | We add (origin allow-list, rate limit, honeypot) |
| Break-glass if GHL is down | Form is unavailable | Form still renders; submit fails until recovery |
| Effort to add a new surface | ~15 min (build form in GHL, drop iframe) | ~1–2 hrs (build markup, wire function, test) |

---

## Scoring — Mamoun's 3 dimensions

Rubric anchors from [ghl-integration-wiring-guide.md §7](ghl-integration-wiring-guide.md).

| Dimension | Option A — GHL native embed | Option B — Custom + webhook/API |
|---|---|---|
| **Integration** (data lands natively in GHL, no translation layer) | **9** — GHL native form. Contact record is created by GHL itself. Zero translation. | **5** — Netlify function is the translation layer. We have to re-shape the payload and call the API; any schema drift breaks the flow. |
| **Reporting & Visibility** (Mamoun sees the funnel in one GHL view) | **8** — GHL reports show the form's opt-ins, conversion, source. Page-view side is Clarity/Plausible. | **7** — Contact appears in GHL with tags, but the "form" itself isn't a GHL form, so GHL's native form analytics don't exist. We have to build the funnel view from tags. |
| **Level of Automation** (tag-trigger + master→child with no glue code) | **9** — Tags applied on submit by the GHL form. Master workflow triggers instantly on tag. | **7** — Tags applied by our function call. Automation works, but fires only after our function succeeds; a function error breaks automation silently unless monitored. |
| **Composite** | **8.7 — ✅ above ≥ 8 threshold** | **6.3 — ⚠️ below threshold, needs justification** |

---

## Recommendation — which to use when

**Default to Option A (GHL native embed).** It scores above threshold. It's faster to ship. Lana can change the form without a PR. Mamoun's "GHL is the single source of truth" principle is satisfied by construction.

**Use Option B only when at least one of these is true:**

1. **Server-side computed data must be on the contact record.** Scorecard is the canonical case: tier, composite score, and dimension breakdowns are computed in JS before submit and must land as GHL custom fields / tags. GHL form fields can't run our scoring logic.
2. **Conditional / multi-step flow that GHL form builder can't express.** E.g. branching questionnaire whose next question depends on prior answers in ways GHL can't model.
3. **Strict styling / UX requirement** that iframe can't satisfy (rare — usually can be solved in GHL theme).
4. **The submission is a side-effect of another action**, not a form — e.g. "click this button to be added to the list" inside an app flow where a form iframe would be wrong UX.

If none of those apply, choose Option A.

**When Option B is chosen, write the exception in the PR description** with: (a) which of the four conditions applies, (b) the 3-dimension score, (c) how the reporting gap will be filled (usually: a GHL dashboard built from the tag taxonomy in §9 of the wiring guide).

---

## Applying this to the current baseline

Cross-reference with the Current State Scorecard in [ghl-integration-wiring-guide.md §10](ghl-integration-wiring-guide.md):

| Surface | Today | Option | Correct choice? |
|---|---|---|---|
| `/book`, `/contact`, newsletter | A (iframe) | A | ✅ |
| Scorecard | B (custom form → Netlify function → API) | B | ✅ justified by condition #1 (server-side scoring) |
| `/cohort-training` (future) | — | A by default | Unless Mamoun requires server-side logic, pick A |
| `/strategy-call` (broken) | — | A | Simplest fix: a GHL form or direct redirect to the GHL booking widget |
| `mailto:` link replacements | — | A | Drop-in contact form iframe |

---

## Checklist for the next lead-capture PR

- [ ] Which option am I picking? (A or B)
- [ ] If B, which of the four conditions justifies it?
- [ ] 3-dimension score filled in (Integration / Reporting / Automation)
- [ ] Composite ≥ 8, or written exception
- [ ] Entry added to §10 Current State Scorecard in the wiring guide
- [ ] Form ID, tag names, workflow names documented in §1 status table
