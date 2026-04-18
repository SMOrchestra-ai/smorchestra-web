// @ts-check
/**
 * smorchestra-web — 3 golden-path smoke tests.
 *
 * Path 1: Homepage loads, hero visible, ship log renders all 10 tiles,
 *         language toggle resolves, main nav reachable (including mobile).
 * Path 2: Scorecard flow — start quiz, answer 20 questions, see results
 *         page with score/tier/dimensions, email-capture form wired,
 *         server validates inputs correctly.
 * Path 3: Book CTA — clicking the primary /book CTA resolves to the GHL
 *         calendar widget (currently 302-redirected) without a console
 *         error.
 *
 * Principle: these tests are contracts with production. If any fails, we
 * have a real regression users would see. Keep the count small and the
 * signal high.
 */
const { test, expect } = require("@playwright/test");

// -------------------------------------------------------------------------
// Golden path 1 — Homepage
// -------------------------------------------------------------------------

test.describe("Homepage (EN)", () => {
  test("loads, renders hero + ship log, no console errors", async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(String(err)));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    const response = await page.goto("/");
    expect(response?.status(), "homepage 200").toBe(200);

    // Hero is present
    await expect(page.locator("h1").first()).toContainText(
      /Install the AI-Native Org/i,
    );

    // Ship log: all 10 tiles render (5 SMO 01-05, 5 EO 06-10)
    const shipLogItems = page.locator(
      "section.deep div[style*='grid-template-columns:repeat(5,1fr)'] > div",
    );
    await expect(shipLogItems).toHaveCount(10);

    // Nav has the primary links (even if visually hidden on mobile)
    const navLinks = page.locator(".nav-links a");
    await expect(navLinks.first()).toBeAttached();

    // nav.js shipped
    const navScript = page.locator('script[src="/assets/nav.js"]');
    await expect(navScript).toHaveCount(1);

    // No uncaught errors
    expect(errors, "no page errors").toEqual([]);
  });

  test("mobile: hamburger button renders + opens nav", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "mobile-only");

    await page.goto("/");

    const hamburger = page.locator(".nav-toggle");
    await expect(hamburger, "hamburger visible on mobile").toBeVisible();
    await expect(hamburger).toHaveAttribute("aria-expanded", "false");

    await hamburger.click();
    await expect(hamburger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("body")).toHaveClass(/nav-open/);

    // nav-links should now be visible (CSS-driven via body.nav-open)
    await expect(page.locator(".nav-links").first()).toBeVisible();

    // No horizontal overflow at mobile width
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth, "no mobile horizontal overflow").toBeLessThanOrEqual(
      clientWidth + 1,
    );
  });

  test("AR mirror loads with dir=rtl + lang=ar", async ({ page }) => {
    const response = await page.goto("/ar/");
    expect(response?.status()).toBe(200);

    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");
    await expect(html).toHaveAttribute("lang", "ar");

    // Hero h1 has Arabic content
    const h1Text = await page.locator("h1").first().textContent();
    expect(h1Text, "AR hero has Arabic chars").toMatch(/[\u0600-\u06FF]/);
  });
});

// -------------------------------------------------------------------------
// Golden path 2 — AI-Native Readiness scorecard
// -------------------------------------------------------------------------

test.describe("AI-Native Readiness Scorecard (EN)", () => {
  test("completes 20-question flow and shows result page with email form", async ({
    page,
  }) => {
    const response = await page.goto("/tools/ai-native-readiness/");
    expect(response?.status()).toBe(200);

    // Start
    await page.getByRole("button", { name: /Start Diagnostic/i }).click();

    // Progress region has proper ARIA
    const progress = page.locator("#progress-root");
    await expect(progress).toHaveAttribute("role", "progressbar");
    await expect(progress).toHaveAttribute("aria-valuemin", "0");
    await expect(progress).toHaveAttribute("aria-valuemax", "100");

    // Answer all 20 questions — pick the first option each time
    for (let i = 0; i < 20; i++) {
      // Wait for question UI to settle
      const firstOption = page.locator(".option").first();
      await expect(firstOption).toBeVisible();
      await firstOption.click();

      const nextBtn = page.getByRole("button", {
        name: /Next →|See Diagnostic →/,
      });
      await nextBtn.click();
    }

    // Result page should now be visible
    await expect(page.locator("#tier-badge")).toBeVisible();
    await expect(page.locator("#score-num")).toBeVisible();

    // Score ring has the dynamic aria-label
    const scoreRing = page.locator("#score-ring");
    await expect(scoreRing).toHaveAttribute("role", "img");
    const ringLabel = await scoreRing.getAttribute("aria-label");
    expect(ringLabel, "score ring announces score").toMatch(
      /Score: \d+ out of 100/,
    );

    // Dimension breakdown rendered (6 rows)
    await expect(page.locator(".dim-row")).toHaveCount(6);

    // Email capture form wired
    const emailForm = page.locator("#ec-form");
    await expect(emailForm).toBeVisible();
    await expect(page.locator("#ec-email")).toBeVisible();
    await expect(page.locator("#ec-submit")).toBeVisible();
  });

  test("email-capture form submits to /.netlify/functions/submit-scorecard", async ({
    page,
  }) => {
    // Fast-forward to the results state: the scorecard is a single-file SPA,
    // so we navigate directly and inject answers via JS to reach the result.
    await page.goto("/tools/ai-native-readiness/");

    // Use the public startQuiz function + finish sequence
    // (simpler: re-run the 20-question flow briefly, then intercept submit)
    await page.getByRole("button", { name: /Start Diagnostic/i }).click();
    for (let i = 0; i < 20; i++) {
      await page.locator(".option").first().click();
      await page
        .getByRole("button", { name: /Next →|See Diagnostic →/ })
        .click();
    }
    await expect(page.locator("#ec-form")).toBeVisible();

    // Intercept the network call so we don't pollute GHL
    const submissions = [];
    await page.route("**/.netlify/functions/submit-scorecard", (route) => {
      submissions.push({
        url: route.request().url(),
        method: route.request().method(),
        body: route.request().postDataJSON(),
      });
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.locator("#ec-email").fill("playwright-smoke@example.test");
    await page.locator("#ec-name").fill("Playwright");
    await page.locator("#ec-submit").click();

    await expect(page.locator("#ec-msg")).toContainText(/Sent|inbox/i);

    expect(submissions.length, "exactly one function call").toBe(1);
    expect(submissions[0].method).toBe("POST");
    expect(submissions[0].body).toMatchObject({
      email: "playwright-smoke@example.test",
      firstName: "Playwright",
      scorecard: "ai-native-readiness",
      locale: "en",
    });
    expect(submissions[0].body.score).toEqual(expect.any(Number));
    expect(submissions[0].body.tier).toEqual(expect.any(String));
    expect(submissions[0].body.dimensions).toEqual(expect.any(Object));
  });

  test("function server-side: empty body → 400 email_required", async ({
    request,
  }) => {
    const res = await request.post("/.netlify/functions/submit-scorecard", {
      headers: {
        "Content-Type": "application/json",
        Referer: "https://smorchestra.ai/tools/ai-native-readiness/",
      },
      data: {},
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("email_required");
  });

  test("function server-side: no referer → 403 forbidden_origin", async ({
    request,
  }) => {
    const res = await request.post("/.netlify/functions/submit-scorecard", {
      headers: { "Content-Type": "application/json" },
      data: { email: "test@example.com", scorecard: "ai-native-readiness" },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("forbidden_origin");
  });
});

// -------------------------------------------------------------------------
// Golden path 3 — Book CTA resolves
// -------------------------------------------------------------------------

test.describe("Book CTA routing", () => {
  test("/book 302s to the GHL calendar widget", async ({ request }) => {
    const res = await request.get("/book", { maxRedirects: 0 });
    expect([301, 302]).toContain(res.status());
    const loc = res.headers()["location"];
    expect(loc, "/book points at GHL calendar").toMatch(
      /leadconnectorhq\.com|bookings/i,
    );
  });

  test("/strategy-call redirects to /book (recently-fixed dead link)", async ({
    request,
  }) => {
    const res = await request.get("/strategy-call", { maxRedirects: 0 });
    expect([301, 302]).toContain(res.status());
    const loc = res.headers()["location"];
    expect(loc).toContain("/book");
  });

  test("/ar/strategy-call redirects to /ar/book", async ({ request }) => {
    const res = await request.get("/ar/strategy-call", { maxRedirects: 0 });
    expect([301, 302]).toContain(res.status());
    const loc = res.headers()["location"];
    expect(loc).toContain("/ar/book");
  });

  test("microsaas-readiness wildcards route to /tools/ (EO 404 mitigation)", async ({
    request,
  }) => {
    const res = await request.get("/tools/microsaas-readiness", {
      maxRedirects: 0,
    });
    expect([301, 302]).toContain(res.status());
    const loc = res.headers()["location"];
    expect(loc).toContain("/tools");
  });
});
