import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildName, buildTrackingUrl } from "../js/url-builder.js";

const config = JSON.parse(
  readFileSync(new URL("../data/campaign-config.json", import.meta.url), "utf8"),
);
const parameters = config.queryParameters;

test("campaign names use configured part order and omit empty parts", () => {
  const name = buildName(
    {
      businessUnit: "ama",
      productName: "",
      platform: "dv",
      campaignType: "prog",
      targeting: "all",
    },
    config.naming.campaignParts,
    config.naming.separator,
  );
  assert.equal(name, "ama_dv_prog_all");
});

test("tracking values are encoded without changing their meaning", () => {
  const url = buildTrackingUrl(
    {
      landingPage: "https://example.com/page",
      source: "email&partner",
      medium: "email",
      campaign: "winter sale",
      content: "cta#one",
      marketingTag: "",
    },
    parameters,
    true,
  );
  assert.equal(
    url,
    "https://example.com/page?utm_source=email%26partner&utm_medium=email&utm_campaign=winter+sale&utm_content=cta%23one",
  );
});

test("existing query and fragment remain in the right positions", () => {
  const url = buildTrackingUrl(
    {
      landingPage: "https://example.com/page?ref=home#pricing",
      source: "google",
      medium: "cpc",
      campaign: "launch",
      content: "",
      marketingTag: "",
    },
    parameters,
    true,
  );
  assert.equal(
    url,
    "https://example.com/page?ref=home&utm_source=google&utm_medium=cpc&utm_campaign=launch#pricing",
  );
});

test("existing tracking parameters are updated instead of duplicated", () => {
  const url = buildTrackingUrl(
    {
      landingPage: "https://example.com/page?utm_source=old",
      source: "new",
      medium: "social",
      campaign: "launch",
      content: "",
      marketingTag: "",
    },
    parameters,
    true,
  );
  assert.equal(new URL(url).searchParams.getAll("utm_source").length, 1);
  assert.equal(new URL(url).searchParams.get("utm_source"), "new");
});

test("Business Profiles can omit campaign, while other purposes require it", () => {
  const fields = {
    landingPage: "https://example.com/page",
    source: "google",
    medium: "organic",
    campaign: "",
    content: "",
    marketingTag: "",
  };
  assert.equal(buildTrackingUrl(fields, parameters, true), "");
  assert.equal(
    buildTrackingUrl(fields, parameters, false),
    "https://example.com/page?utm_source=google&utm_medium=organic",
  );
});

test("landing page must be a complete HTTP or HTTPS URL", () => {
  const fields = {
    landingPage: "example.com/page",
    source: "google",
    medium: "cpc",
    campaign: "launch",
    content: "",
    marketingTag: "",
  };
  assert.throws(() => buildTrackingUrl(fields, parameters, true), /HTTP or HTTPS/);
  assert.throws(
    () => buildTrackingUrl({ ...fields, landingPage: "mailto:test@example.com" }, parameters, true),
    /HTTP or HTTPS/,
  );
});
