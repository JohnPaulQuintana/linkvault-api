const cheerio = require("cheerio");
const axios = require("axios");
const cloudscraper = require("cloudscraper");
const { getBrowser } = require("./playwright/browser");

/**
 * -------------------------
 * BLOCKED PLATFORM CHECK
 * -------------------------
 */
const blockedDomains = [];

const isBlockedPlatform = (url) => {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    return blockedDomains.some((d) => host.includes(d));
  } catch {
    return false;
  }
};

/**
 * -------------------------
 * CLEAN TEXT
 * -------------------------
 */
const cleanText = (text = "") => {
  return text
    .replace(/\s+/g, " ")
    .replace(/[\n\r\t]/g, " ")
    .trim();
};

/**
 * -------------------------
 * BLOCK DETECTION
 * -------------------------
 */
const isBlockedHtml = (html = "") => {
  const t = html.toLowerCase();
  return (
    t.includes("access denied") ||
    t.includes("cloudflare") ||
    t.includes("captcha") ||
    t.includes("enable javascript") ||
    t.includes("attention required")
  );
};

/**
 * -------------------------
 * FETCH STATIC HTML
 * -------------------------
 */
async function fetchHtml(url) {
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
    });

    const html = res?.data;

    if (html && html.length > 1000 && !isBlockedHtml(html)) {
      return html;
    }

    throw new Error("Invalid static HTML");
  } catch {
    try {
      const html = await cloudscraper.get({
        uri: url,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        },
      });

      if (html && html.length > 1000 && !isBlockedHtml(html)) {
        return html;
      }

      return null;
    } catch {
      return null;
    }
  }
}

/**
 * -------------------------
 * PLAYWRIGHT HTML FALLBACK (IMPORTANT FIX)
 * -------------------------
 */
async function fetchRenderedHtml(url) {
  let browser;
  let page;

  try {
    browser = await getBrowser();
    const context = await browser.newContext();

    page = await context.newPage();

    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    }).catch(() => {});

    await page.waitForTimeout(4000);

    const html = await page.content();

    await context.close();

    return html;
  } catch {
    return null;
  } finally {
    try {
      if (page) await page.close();
    } catch {}
  }
}

/**
 * -------------------------
 * GET BEST DESCRIPTION
 * -------------------------
 */
exports.getPreviewDescription = async (url, fallbackDescription = null) => {
  try {
    if (isBlockedPlatform(url)) return fallbackDescription;

    // STEP 1: static fetch
    let html = await fetchHtml(url);

    // STEP 2: fallback to rendered HTML (CRITICAL)
    if (!html || html.length < 2000) {
      html = await fetchRenderedHtml(url);
    }

    if (!html) return fallbackDescription;

    const $ = cheerio.load(html);

    /**
     * -------------------------
     * META DESCRIPTION (FAST PATH)
     * -------------------------
     */
    const meta =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      $('meta[itemprop="description"]').attr("content");

    if (meta) {
      const cleaned = cleanText(meta);
      if (cleaned.length > 5) {
        return cleaned.slice(0, 180);
      }
    }

    /**
     * -------------------------
     * BODY FALLBACK TEXT (NO SCORING)
     * -------------------------
     */
    const textBlocks = [];

    $("p, span").each((_, el) => {
      const text = cleanText($(el).text());

      if (!text) return;

      if (text.length < 20) return;

      if (
        text.toLowerCase().includes("cookie") ||
        text.toLowerCase().includes("sign in") ||
        text.toLowerCase().includes("login") ||
        text.toLowerCase().includes("enable javascript")
      ) return;

      textBlocks.push(text);
    });

    if (textBlocks.length > 0) {
      // pick longest meaningful block
      textBlocks.sort((a, b) => b.length - a.length);
      return textBlocks[0].slice(0, 180);
    }

    /**
     * -------------------------
     * TITLE FALLBACK
     * -------------------------
     */
    const title = cleanText($("title").text());

    if (title && title.length > 5) {
      return title.slice(0, 180);
    }

    return fallbackDescription;
  } catch (err) {
    console.log("getPreviewDescription error:", err.message);
    return fallbackDescription;
  }
};