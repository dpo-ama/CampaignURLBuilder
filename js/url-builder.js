export function buildName(fields, parts, separator) {
  return parts.map((part) => fields[part]).filter(Boolean).join(separator);
}

export function buildTrackingUrl(fields, queryParameters, campaignRequired) {
  if (!fields.landingPage) {
    return "";
  }

  let url;
  try {
    url = new URL(fields.landingPage);
  } catch {
    throw new Error("Enter a complete HTTP or HTTPS landing page URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Enter an HTTP or HTTPS landing page URL.");
  }
  if (campaignRequired && !fields.campaign) {
    return "";
  }

  for (const { field, name, includeWhenEmpty } of queryParameters) {
    if (includeWhenEmpty || fields[field]) {
      url.searchParams.set(name, fields[field] ?? "");
    }
  }

  return url.toString();
}
