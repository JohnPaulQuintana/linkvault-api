const scraper = require("./scrapper/scraper.service");
const { checkUrlAccessible } = require("./safety/checkUrlAccessible");
const { getDomain } = require("./scrapper/helpers/getDomain");
const AppError = require("../utils/AppError");

const normalizeUrl = (url) => {
  try {
    const u = new URL(url);

    return `${u.hostname.replace(/^www\./, "")}${u.pathname}`
      .toLowerCase()
      .replace(/\/$/, "");
  } catch {
    return url;
  }
};


exports.scrapperLink = async ({
  url,
  link_type,
}) => {
  // 1. DUPLICATE CHECK (IMPORTANT)
  const normalizedUrlText = normalizeUrl(url);
  const domain = getDomain(url);
  // const normalizedTitle = (title || "").trim().toLowerCase();

  console.log(url, domain)

  // =========================
  // CHECK URL ACCESSIBILITY
  // =========================
  const accessibility = await checkUrlAccessible(url);

  if (!accessibility.accessible) {
    const reasonMap = {
      blocked: "The website domain could not be reached.",
      // dns_error: "The website domain could not be reached.",
      timeout: "The website took too long to respond.",
      connection_refused: "The website refused the connection request.",
      not_found: "The website or page does not exist.",
      server_error: "The website is currently experiencing server issues.",
      request_failed: "Unable to access the website at this time.",
    };

    throw new AppError(
      reasonMap[accessibility.reason] || "Unable to access this website.",
      400,
      "LINK_UNAVAILABLE",
      accessibility,
    );
  }

  // 2. SCRAPE / GENERATE PREVIEW
  let preview = await scraper.generateTypedContent(url, link_type);

  console.log(preview);

  // 3. SAFE MERGE (user input wins)
  const data = {
    url,
    title: preview?.title || "Untitled",
    description: preview?.description || null,
    image: preview?.image || null,
    favicon: preview?.favicon || null,
    domain: preview?.domain || null,
    platform: preview.type || null,
    safety_status: preview.safety.status,
  };

  return data;
};