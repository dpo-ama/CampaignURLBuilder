import { buildName, buildTrackingUrl } from "./url-builder.js";

const field = (id) => document.getElementById(id);
let config;

// Microsoft Teams needs this handshake, even though the page also runs in a browser.
window.microsoftTeams?.app?.initialize().catch(() => {});

function selectedPurpose() {
  return config.purposes.find((purpose) => purpose.id === field("utmPurpose").value);
}

function selectedPlatform() {
  return config.platforms.find((platform) => platform.value === field("platform").value);
}

function fillSelect(select, placeholder, options) {
  select.replaceChildren(new Option(placeholder, ""));
  for (const { value, label } of options) {
    select.add(new Option(label, value));
  }
}

function setVisible(element, visible, display = "flex") {
  element.style.display = visible ? display : "none";
}

function setReadOnly(element, readOnly) {
  element.readOnly = readOnly;
  element.classList.toggle("bg-gray-50", readOnly);
}

function validateConfig(data) {
  if (
    data.schemaVersion !== 1 ||
    !Array.isArray(data.purposes) ||
    !data.mediums ||
    !data.sources ||
    !Array.isArray(data.businessUnits) ||
    !Array.isArray(data.platforms) ||
    !data.campaignTypes ||
    !Array.isArray(data.insertionOrderTypes) ||
    !data.naming ||
    !Array.isArray(data.queryParameters)
  ) {
    throw new Error("Campaign configuration has an unsupported format.");
  }
  for (const purpose of data.purposes) {
    if (!purpose.id || !purpose.label || !purpose.campaign?.mode) {
      throw new Error("A campaign purpose is incomplete.");
    }
    for (const medium of purpose.mediums ?? []) {
      if (!data.mediums[medium]) throw new Error(`Unknown medium: ${medium}`);
    }
    for (const source of purpose.sourceOverride?.options ?? []) {
      if (!data.sources[source]) throw new Error(`Unknown source: ${source}`);
    }
  }
  for (const medium of Object.values(data.mediums)) {
    for (const source of medium.source?.options ?? []) {
      if (!data.sources[source]) throw new Error(`Unknown source: ${source}`);
    }
  }
  for (const platform of data.platforms) {
    for (const type of platform.campaignTypes ?? []) {
      if (!data.campaignTypes[type]) throw new Error(`Unknown campaign type: ${type}`);
    }
  }
}

function generateFinalURL() {
  const source =
    field("sourceTextbox").style.display !== "none"
      ? field("sourceTextbox").value
      : field("sourceDropdown").value;
  const campaign =
    selectedPurpose()?.campaign.mode === "generated"
      ? field("campaignNamePPC").value
      : field("manualCampaignName").value;
  const urlError = field("urlError");
  try {
    field("finalURL").value = buildTrackingUrl(
      {
        landingPage: field("landingPage").value,
        source,
        medium: field("medium").value,
        campaign,
        content: field("contentName").value,
        marketingTag: field("marketingTag").value,
      },
      config.queryParameters,
      selectedPurpose()?.campaign.required ?? true,
    );
    urlError.hidden = true;
  } catch (error) {
    field("finalURL").value = "";
    urlError.textContent = error.message;
    urlError.hidden = false;
  }
}

function generateCampaignFields() {
  const platform = selectedPlatform();
  const campaignType = field("campaignType").value;
  const values = {
    businessUnit: field("businessUnit").value,
    productName: field("productName").value,
    platform: field("platform").value,
    campaignType: config.campaignTypes[campaignType]?.outputCode ?? campaignType,
    targeting: field("targeting").value,
    insertionOrderType: field("dvInsertionOrder").value,
    insertionOrderTargeting: field("ioTargeting").value,
  };
  field("campaignNamePPC").value = buildName(
    values,
    config.naming.campaignParts,
    config.naming.separator,
  );
  field("ioNameDisplay").value = platform?.showInsertionOrder
    ? buildName(values, config.naming.insertionOrderParts, config.naming.separator)
    : "";
  generateFinalURL();
}

function handlePlatformChange() {
  const platform = selectedPlatform();
  const campaignTypeSelect = field("campaignType");
  fillSelect(
    campaignTypeSelect,
    "Select Type",
    (platform?.campaignTypes ?? []).map((value) => ({
      value,
      label: config.campaignTypes[value].label,
    })),
  );

  const showInsertionOrder = !!platform?.showInsertionOrder;
  for (const id of [
    "dvInsertionOrderSection",
    "dvIOTargetingSection",
    "ioDisplaySection",
  ]) {
    setVisible(field(id), showInsertionOrder);
  }

  campaignTypeSelect.disabled = !!platform?.campaignTypeLocked;
  if (campaignTypeSelect.disabled) {
    campaignTypeSelect.value = platform.campaignTypes[0];
  }

  const targeting = field("targeting");
  targeting.value = platform?.targeting?.default ?? "";
  setReadOnly(targeting, !!platform?.targeting?.readOnly);
  if (!showInsertionOrder) {
    field("dvInsertionOrder").value = "";
    field("ioTargeting").value = "";
    field("ioNameDisplay").value = "";
  }
  generateCampaignFields();
}

function handleMediumChange() {
  const purpose = selectedPurpose();
  const medium = config.mediums[field("medium").value];
  const source = purpose?.sourceOverride ?? medium?.source;
  const textbox = field("sourceTextbox");
  const dropdown = field("sourceDropdown");

  setVisible(textbox, source?.mode === "text", "block");
  setVisible(dropdown, source?.mode !== "text", "block");
  textbox.value = "";
  fillSelect(
    dropdown,
    "Select Source",
    (source?.mode === "select" ? source.options : []).map((value) => ({
      value,
      label: config.sources[value].label,
    })),
  );
  generateFinalURL();
}

function handlePurposeChange() {
  const purpose = selectedPurpose();
  setVisible(field("ppcSection"), purpose?.campaign.mode === "generated", "block");
  setVisible(field("manualCampaignSection"), purpose?.campaign.mode !== "generated");
  setVisible(field("vanityField"), !!purpose?.showVanityField);

  fillSelect(
    field("medium"),
    "Select Medium",
    (purpose?.mediums ?? []).map((value) => ({
      value,
      label: config.mediums[value].label,
    })),
  );
  field("vanity").value = "";
  field("manualCampaignName").value = "";

  const content = field("contentName");
  content.value = purpose?.content.mode === "fixed" ? purpose.content.value : "";
  setReadOnly(content, purpose?.content.mode === "fixed");
  handleMediumChange();
}

function handleVanityChange() {
  const vanity = field("vanity").value;
  const content = field("contentName");
  const prefix = selectedPurpose()?.content.prefix ?? "";
  content.value = vanity ? `${prefix}${vanity}` : "";
  setReadOnly(content, !!vanity);
  generateFinalURL();
}

async function copyValue(inputId, iconId, textId) {
  const icon = field(iconId);
  const text = field(textId);
  try {
    await navigator.clipboard.writeText(field(inputId).value);
    icon.textContent = "\u2713";
    text.textContent = "Copied!";
  } catch {
    text.textContent = "Copy failed";
  }
  setTimeout(() => {
    icon.textContent = "\u{1F4CB}";
    text.textContent = "Copy";
  }, 2000);
}

function clearForm() {
  for (const input of document.querySelectorAll("input, select, textarea")) {
    input.value = "";
  }
  handlePurposeChange();
  handlePlatformChange();
}

function bindEvents() {
  field("utmPurpose").addEventListener("change", handlePurposeChange);
  field("medium").addEventListener("change", handleMediumChange);
  field("platform").addEventListener("change", handlePlatformChange);
  field("vanity").addEventListener("input", handleVanityChange);

  for (const id of [
    "businessUnit",
    "productName",
    "campaignType",
    "targeting",
    "dvInsertionOrder",
    "ioTargeting",
  ]) {
    const event = ["businessUnit", "campaignType", "dvInsertionOrder"].includes(id)
      ? "change"
      : "input";
    field(id).addEventListener(event, generateCampaignFields);
  }
  for (const id of [
    "landingPage",
    "sourceTextbox",
    "sourceDropdown",
    "manualCampaignName",
    "contentName",
    "marketingTag",
  ]) {
    field(id).addEventListener(id === "sourceDropdown" ? "change" : "input", generateFinalURL);
  }

  field("clearButton").addEventListener("click", clearForm);
  field("copyCampaignButton").addEventListener("click", () =>
    copyValue("campaignNamePPC", "copyIcon", "copyText"),
  );
  field("copyIOButton").addEventListener("click", () =>
    copyValue("ioNameDisplay", "copyIOIcon", "copyIOText"),
  );
  field("copyURLButton").addEventListener("click", () =>
    copyValue("finalURL", "copyURLIcon", "copyURLText"),
  );
}

async function start() {
  const controls = document.querySelectorAll("button, input, select, textarea");
  controls.forEach((control) => (control.disabled = true));
  try {
    const configUrl = new URL("../data/campaign-config.json", import.meta.url);
    const response = await fetch(configUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    config = await response.json();
    validateConfig(config);

    fillSelect(
      field("utmPurpose"),
      "Select Purpose",
      config.purposes.map((purpose) => ({ value: purpose.id, label: purpose.label })),
    );
    fillSelect(field("businessUnit"), "Select Business Unit", config.businessUnits);
    fillSelect(field("platform"), "Select Platform", config.platforms);
    fillSelect(field("dvInsertionOrder"), "Select Type", config.insertionOrderTypes);

    controls.forEach((control) => (control.disabled = false));
    bindEvents();
  } catch (error) {
    field("configError").textContent = `Campaign options could not be loaded: ${error.message}`;
    field("configError").hidden = false;
  }
}

start();
