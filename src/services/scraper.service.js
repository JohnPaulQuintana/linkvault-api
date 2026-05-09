const axios = require("axios");
const cheerio = require("cheerio");
const { normalizeUrl } = require("../utils/normalizeUrl");

/**
 * -------------------------
 * HELPERS
 * -------------------------
 */

const cleanText = (text) => {
  if (!text) return null;
  return text
    .replace(/\s+/g, " ")
    .replace(/[\n\r\t]/g, " ")
    .trim();
};

const getDomain = (url) => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
};

const resolveUrl = (base, src) => {
  try {
    if (!src) return null;
    if (src.startsWith("http")) return src;
    if (src.startsWith("//")) return "https:" + src;
    return new URL(src, base).href;
  } catch {
    return null;
  }
};

/**
 * -------------------------
 * WEBSITE SCRAPER
 * -------------------------
 */

exports.generateWebsiteContent = async (inputUrl) => {
  const url = normalizeUrl(inputUrl);

  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    timeout: 10000,
  });

  const $ = cheerio.load(response.data);

  let title =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("title").text();

  let description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content");

  let image =
    $('meta[property="og:image"]').attr("content");

  let favicon =
    $('link[rel="icon"]').attr("href");

  return {
    url,
    domain: getDomain(url),
    title: cleanText(title) || "Untitled",
    description: cleanText(description),
    image: resolveUrl(url, image),
    favicon: resolveUrl(url, favicon),
    type: "website",
    metadata: {},
  };
};

/**
 * -------------------------
 * GOOGLE (SHEET / DOC / DRIVE)
 * -------------------------
 */

const generateGoogleMeta = (url) => {
  const domain = getDomain(url);

  return {
    url,
    domain,
    title: "Google Workspace File",
    description: "Google document or sheet",
    image: "https://ui-avatars.com/api/?name=Google+File&background=4285F4&color=fff&size=512",
    favicon:
      "https://ssl.gstatic.com/docs/doclist/images/infinite_arrow_favicon_5.ico",
    type: "google",
    metadata: {
      provider: "google",
    },
  };
};

/**
 * -------------------------
 * YOUTUBE
 * -------------------------
 */

const generateYoutubeMeta = (url) => {
  const domain = getDomain(url);

  let videoId = null;

  try {
    const u = new URL(url);

    if (u.hostname.includes("youtu.be")) {
      videoId = u.pathname.slice(1);
    }

    if (u.searchParams.get("v")) {
      videoId = u.searchParams.get("v");
    }
  } catch {}

  const thumbnail = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null;

  return {
    url,
    domain,
    title: "YouTube Video",
    description: null,

    image: thumbnail,

    favicon: "https://www.youtube.com/s/desktop/favicon.ico",

    type: "youtube",
    metadata: {
      provider: "youtube",
      videoId,
    },
  };
};

/**
 * -------------------------
 * GITHUB
 * -------------------------
 */

const generateGithubMeta = (url) => {
  const domain = getDomain(url);

  let repoPath = null;

  try {
    const u = new URL(url);
    repoPath = u.pathname.replace("/", "");
  } catch {}

  return {
    url,
    domain,
    title: "GitHub Repository",
    description: repoPath,

    image:
      "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",

    favicon: "https://github.githubassets.com/favicons/favicon.png",

    type: "github",
    metadata: {
      provider: "github",
      repo: repoPath,
    },
  };
};

/**
 * -------------------------
 * NOTION
 * -------------------------
 */

const generateNotionMeta = (url) => {
  const domain = getDomain(url);

  return {
    url,
    domain,
    title: "Notion Page",
    description: "Notion workspace page",

    image:
      "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",

    favicon: "https://www.notion.so/images/favicon.ico",

    type: "notion",
    metadata: {
      provider: "notion",
    },
  };
};

/**
 * -------------------------
 * TYPE ROUTER
 * -------------------------
 */

exports.generateTypedContent = async (url, type) => {
  switch (type) {
    case "website":
      return exports.generateWebsiteContent(url);

    case "youtube":
      return generateYoutubeMeta(url);

    case "google_sheet":
    case "google_doc":
    case "google_drive":
      return generateGoogleMeta(url);

    case "github":
      return generateGithubMeta(url);

    case "notion":
      return generateNotionMeta(url);

    default:
      return {
        url,
        domain: getDomain(url),
        title: "Unsupported link",
        description: null,
        image: null,
        favicon: null,
        type: "unknown",
        metadata: {},
      };
  }
};