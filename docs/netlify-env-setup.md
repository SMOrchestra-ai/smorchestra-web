# Netlify Environment Variables — smorchestra-web

The scorecard lead-capture Netlify function (`netlify/functions/submit-scorecard.js`) reads two secrets from the Netlify build environment. They **must not** be committed to the repo — the PIT token in particular is a GHL Private Integration Token and grants API access.

## Required variables

| Name | Value | Notes |
|---|---|---|
| `GHL_CONTENT_ENGINE_PIT` | `pit-...` (36 chars after prefix) | GHL v2 API Private Integration Token. Server-only. |
| `GHL_EO_LOCATION_ID` | `7IYdMpQvOejcQmZdDjAQ` | GHL Location ID for the Entrepreneurs Oasis subaccount. |

## How to set them

### Option 1 — Netlify UI (recommended for first-time setup)

1. Open https://app.netlify.com → select the smorchestra-web site.
2. **Site configuration → Environment variables → Add a variable**.
3. Add each of the two variables above.
4. For each: set scopes to **"All scopes"** (functions + builds + runtime). Set **"Values for deploy contexts"** to **All**.
5. Save. A redeploy is not strictly required for runtime (functions pick up env on cold start), but trigger one via **Deploys → Trigger deploy → Clear cache and deploy** to be safe.

### Option 2 — Netlify CLI (if the CLI is already linked to this site)

```bash
# From the repo root:
netlify env:set GHL_CONTENT_ENGINE_PIT "pit-..."
netlify env:set GHL_EO_LOCATION_ID "7IYdMpQvOejcQmZdDjAQ"
netlify deploy --prod  # or wait for the next git push to trigger a deploy
```

## How to verify it's wired correctly

After the next deploy:

```bash
# Should return 400 with {"error":"email_required"} — proves function runs + envs load.
curl -X POST https://smorchestra.ai/.netlify/functions/submit-scorecard \
  -H "Content-Type: application/json" \
  -H "Referer: https://smorchestra.ai/tools/ai-native-readiness/" \
  -d '{}'
```

If you get `{"error":"server_misconfigured"}` instead, the env vars didn't load — redeploy after setting them.

To verify a real submission end-to-end:

1. Go to https://smorchestra.ai/tools/ai-native-readiness/
2. Complete all 20 questions.
3. On the results page, enter a real email + name, click "Send me the PDF".
4. Within a few seconds, check the GHL contact inbox for the EO subaccount — a new contact should appear with tags:
   - `scorecard:ai-native-readiness`
   - `scorecard-tier:<green|yellow|red>`
   - `scorecard-bucket:<high|mid|low>`
   - `scorecard-locale:en` (or `ar`)
   - `source:smorchestra-web`

## What the function does NOT do yet (follow-up tasks)

- It does not attach scorecard score/dimensions to GHL custom fields — only to tags. To attach to custom fields, we'd need the field IDs from the GHL subaccount (API: `GET /locations/{locationId}/customFields` with the PIT).
- It does not trigger a GHL workflow. Lead delivery (the actual PDF email) should be configured inside GHL as a tag-based automation: when `scorecard:ai-native-readiness` is added → send PDF report. Set that up in GHL → Automations.
- It does not send the PDF itself. The promise in the UI ("Delivered to your inbox") is fulfilled by the GHL workflow you configure. If you want to skip GHL and send the PDF directly from the function, replace the GHL call with a transactional email provider (Resend, Postmark, etc.) — different architecture.

## Security notes

- The PIT is never exposed to the browser. Client code only calls the Netlify function URL (`/.netlify/functions/submit-scorecard`); the function holds the PIT in memory and calls GHL server-side.
- The function rejects requests whose `Referer` header doesn't match `smorchestra.ai` or `*.netlify.app` (defense in depth against drive-by abuse — can be disabled later if you need to call from other origins).
- If the PIT is ever exposed (accidental commit, log leak, etc.), rotate it immediately in GHL → Settings → Integrations → Private Integrations, then update the Netlify env var.
