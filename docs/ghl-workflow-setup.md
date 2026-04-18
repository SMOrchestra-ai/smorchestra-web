# GHL Workflow Setup — AI-Native Readiness Scorecard Lead Nurture

The Netlify function at `/.netlify/functions/submit-scorecard` creates/updates a contact in the EO GHL subaccount and applies these tags:

- `scorecard:ai-native-readiness`
- `scorecard-tier:green` · `scorecard-tier:yellow` · `scorecard-tier:red` (one, based on score)
- `scorecard-bucket:high` · `scorecard-bucket:mid` · `scorecard-bucket:low`
- `scorecard-locale:en` or `scorecard-locale:ar`
- `source:smorchestra-web`

The function **does not send the email itself**. Email delivery is a GHL Automation that you configure once in the GHL UI. This doc walks through the simplest viable setup (Option 1: generic report, same email to every submitter).

---

## Step 1 — Confirm the report URLs are live

After the next deploy:

- EN: https://smorchestra.ai/reports/ai-native-readiness-framework.html
- AR: https://smorchestra.ai/ar/reports/ai-native-readiness-framework.html

Both are public, crawlable, print-optimized (A4 clean when the user prints-to-PDF from their browser). The hero copy, dimensions, tier paths, and 90-day action plans are all in the HTML — no external dependencies.

**Optional — save as a PDF attachment once:**
1. Open each URL in Chrome or Safari.
2. File → Print → "Save as PDF" (portrait, default margins).
3. Upload both PDFs to GHL Files library:
   - `AI-Native-Readiness-Framework-EN.pdf`
   - `AI-Native-Readiness-Framework-AR.pdf`

If you skip the PDF step, the email just contains a link. Both work.

---

## Step 2 — Build the GHL Workflow

In GHL (Entrepreneurs Oasis subaccount, Location ID `7IYdMpQvOejcQmZdDjAQ`):

1. **Automations → Workflows → Create workflow → Start from scratch**
2. **Name:** `Scorecard · AI-Native Readiness · Report Delivery`
3. **Trigger:** Contact Tag Added
   - Filter: tag equals `scorecard:ai-native-readiness`
4. **Wait:** 30 seconds (lets any follow-up tags like `scorecard-locale:ar` land before branching)

### Branch A — Arabic path

5. **If/else:** contact has tag `scorecard-locale:ar` → route here, otherwise route to Branch B
6. **Send Email:**
   - **From:** Mamoun · hello@smorchestra.ai (or your preferred sender)
   - **Subject:** `تقرير جاهزية AI-Native — الإطار الكامل + خطة الـ٩٠ يوم`
   - **Body (short, ~120 words):**

     ```
     أهلاً [first_name or "يا مرحبا"],

     شكراً على إكمال تقييم جاهزية AI-Native. جاي لك الإطار الكامل اللي وعدناك فيه — الأبعاد الستة، المسارات الثلاث، وخطة الـ٩٠ يوم اللي تناسب فئتك.

     اقرأ الإطار: https://smorchestra.ai/ar/reports/ai-native-readiness-framework.html

     الخطوة التالية: لو حابب نناقش نتيجتك ومسار الـ٩٠ يوم المحدّد لمؤسستك، احجز ٣٠ دقيقة:
     https://smorchestra.ai/ar/book?source=ai-native-readiness-framework-email

     — مأمون العموري
     SMOrchestra.ai · دبي
     ```
   - **Attachment (if you saved the PDF in step 1):** `AI-Native-Readiness-Framework-AR.pdf`

### Branch B — English path (default)

7. **Send Email:**
   - **From:** Mamoun · hello@smorchestra.ai
   - **Subject:** `Your AI-Native Readiness report + 90-day action plan`
   - **Body:**

     ```
     Hi [first_name or "there"],

     Thanks for completing the AI-Native Readiness diagnostic. Here's the full framework you asked for — six dimensions, three tier paths, and the 90-day action plan that matches your score.

     Read the framework: https://smorchestra.ai/reports/ai-native-readiness-framework.html

     Next step: if you'd like to talk through your score and the specific 90-day path for your enterprise, book 30 minutes:
     https://smorchestra.ai/book?source=ai-native-readiness-framework-email

     — Mamoun Alamouri
     SMOrchestra.ai · Dubai
     ```
   - **Attachment (if you saved the PDF in step 1):** `AI-Native-Readiness-Framework-EN.pdf`

### Optional — tier-specific follow-up (stays in this workflow)

8. After a 2-day wait, branch again by `scorecard-tier:green` / `yellow` / `red` and send a tier-specific nudge:

   - **GREEN:** "You're top-quartile — if the private briefing path resonates, here's the direct calendar link for GREEN-tier completers (free, 90 min, Riyadh or Dubai)."
   - **YELLOW:** "Most KSA enterprises sit here. If you want the 30-min Tier-3 diagnostic scope call, here's the link."
   - **RED:** "The 30-day diagnostic engagement (SAR 35k) is the right move before any large AI commit. Want the scope doc?"

Skip this until the base workflow has processed a handful of real submissions — it's tuning, not v1.

---

## Step 3 — Test

1. Go to https://smorchestra.ai/tools/ai-native-readiness/ , complete all 20 questions with a test email you control (e.g., `yourname+test@gmail.com`).
2. On the results page, submit the email-capture form.
3. Within ~10 seconds, you should see a new contact in the EO GHL subaccount tagged with the four `scorecard:*` tags listed at the top of this doc.
4. Within ~1 minute, the report-delivery email should arrive in your test inbox.
5. Repeat for AR at https://smorchestra.ai/ar/tools/ai-native-readiness/ to confirm the Arabic branch fires.

If the contact appears but the email doesn't arrive within 5 minutes, the workflow trigger isn't firing — check the workflow is published (not Draft), and that the trigger tag exactly matches `scorecard:ai-native-readiness` (colon, lowercase).

---

## Monitoring

The Netlify function logs every submission. To see recent activity:

```bash
netlify functions:list --help  # once CLI is linked
# or in the UI: Site → Functions → submit-scorecard → Recent invocations
```

Failed GHL upserts show up as `502 upstream_error` in the function logs with the GHL status code. The most common cause of 4xx from GHL is an invalid or rotated PIT — re-check `GHL_CONTENT_ENGINE_PIT` in Netlify env vars.

---

## Follow-ups (not v1)

- **Tier-specific reports.** Three separate URLs (`/reports/ai-native-readiness-framework-green.html` etc.) with customized 90-day action plans. Moves from Option 1 to Option 2 per the product decision log. Cleanest implementation: the workflow branches on `scorecard-tier:*` and picks the matching URL.
- **Personalized PDF.** Dynamic PDF generation with the submitter's actual score + dimension breakdown inlined. Requires adding a PDF-generation service (Resend/react-pdf/puppeteer-on-Netlify) — different architecture, days of work.
- **Custom fields on GHL contact.** Right now tags carry the score/tier/bucket. To also attach to GHL custom fields (for better segmentation inside GHL), pull the field IDs from `GET /locations/{locationId}/customFields` and extend the Netlify function payload.
