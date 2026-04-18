// SMOrchestra scorecard lead capture — POSTs to GHL v2 Contacts API with scorecard tags.
// PIT stays server-side only. Client never sees it.
// Env required: GHL_CONTENT_ENGINE_PIT, GHL_EO_LOCATION_ID (see docs/netlify-env-setup.md).

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "method_not_allowed" }),
    };
  }

  const referer = event.headers.referer || event.headers.referrer || "";
  const allowedHost =
    /https?:\/\/([^/]+\.)?(smorchestra\.ai|netlify\.app)(\/|$)/;
  if (!allowedHost.test(referer)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "forbidden_origin" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "invalid_json" }) };
  }

  const {
    email,
    firstName,
    scorecard,
    score,
    tier,
    dimensions,
    answers,
    locale,
  } = body;

  const emailOk =
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  if (!emailOk) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "email_required" }),
    };
  }
  if (!scorecard || typeof scorecard !== "string") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "scorecard_required" }),
    };
  }

  const pit = process.env.GHL_CONTENT_ENGINE_PIT;
  const locationId = process.env.GHL_EO_LOCATION_ID;

  if (!pit || !locationId) {
    console.error("Missing GHL_CONTENT_ENGINE_PIT or GHL_EO_LOCATION_ID");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "server_misconfigured" }),
    };
  }

  const tierSlug =
    String(tier || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "unknown";
  const scoreNum = Number(score);
  const scoreBucket =
    Number.isFinite(scoreNum) && scoreNum >= 71
      ? "high"
      : Number.isFinite(scoreNum) && scoreNum >= 40
        ? "mid"
        : "low";

  const contact = {
    email: email.trim().toLowerCase(),
    firstName:
      typeof firstName === "string" ? firstName.trim().slice(0, 80) : "",
    locationId,
    source: "smorchestra.ai",
    tags: [
      `scorecard:${scorecard}`,
      `scorecard-tier:${tierSlug}`,
      `scorecard-bucket:${scoreBucket}`,
      `scorecard-locale:${locale === "ar" ? "ar" : "en"}`,
      "source:smorchestra-web",
    ],
  };

  try {
    const ghlRes = await fetch(
      "https://services.leadconnectorhq.com/contacts/upsert",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pit}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(contact),
      },
    );

    if (!ghlRes.ok) {
      const errText = await ghlRes.text().catch(() => "");
      console.error("GHL upsert failed:", ghlRes.status, errText.slice(0, 500));
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "upstream_error",
          status: ghlRes.status,
        }),
      };
    }

    console.log("scorecard_submission_ok", {
      scorecard,
      score: scoreNum,
      tier: tierSlug,
      bucket: scoreBucket,
      dimensions,
      answerCount: Array.isArray(answers) ? answers.length : 0,
      locale,
      timestamp: new Date().toISOString(),
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error("submit-scorecard internal error:", err && err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "internal_error" }),
    };
  }
};
