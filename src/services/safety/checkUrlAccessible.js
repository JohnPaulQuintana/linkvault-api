const axios = require("axios");
const cloudscraper = require("cloudscraper");
const { getBrowser } = require("../scrapper/helpers/playwright/browser");

/**
 * -------------------------
 * DEBUG LOGGER
 * -------------------------
 */
const debug = (stage, data) => {
  console.log(`[URL CHECK:${stage}]`, JSON.stringify(data, null, 2));
};

/**
 * -------------------------
 * ONLY TRUE BLOCK DETECTION
 * -------------------------
 * IMPORTANT:
 * ONLY detect real blocking pages, NOT SPA apps
 */
const isBadHtml = (html = "") => {
  const t = html.toLowerCase();

  const blockedSignals = [
    "just a moment",
    "cloudflare",
    "checking your browser",
    "captcha",
    "verify you are human",
    "access denied",
    "request blocked",
    "attention required",
    "suspicious activity",
  ];

  return blockedSignals.some((s) => t.includes(s));
};

/**
 * -------------------------
 * PLAYWRIGHT CHECK (REAL DOM VALIDATION)
 * -------------------------
 */
async function checkWithBrowser(url) {
  let browser;
  let page;
  let context;

  try {
    debug("PLAYWRIGHT_START", { url });

    browser = await getBrowser();

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
      locale: "en-US",
      extraHTTPHeaders: {
        "accept-language": "en-US,en;q=0.9",
        "upgrade-insecure-requests": "1",
        referer: "https://www.google.com/",
      },
    });

    page = await context.newPage();

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    }).catch(() => {});

    /**
     * STEP 1: wait for ANY meaningful DOM signal (NOT fixed timeout)
     */
    await page.waitForFunction(() => {
      return (
        document.querySelector("img") ||
        document.querySelector("article") ||
        document.querySelector("h1") ||
        document.querySelector("a") ||
        document.body?.innerText?.length > 50
      );
    }, { timeout: 12000 }).catch(() => {});

    /**
     * STEP 2: trigger SPA lazy load
     */
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await page.waitForTimeout(1500);

    /**
     * STEP 3: re-evaluate AFTER hydration
     */
    const result = await page.evaluate(() => {
      const bodyText = document.body?.innerText || "";
      const images = document.querySelectorAll("img").length;
      const links = document.querySelectorAll("a").length;
      const title = document.title || "";

      return {
        textLength: bodyText.trim().length,
        images,
        links,
        titleLength: title.length,
        hasBody: !!document.body,
      };
    });

    /**
     * FINAL VALIDATION (SPA SAFE RULE)
     */
    const isValid =
      result.hasBody &&
      (
        result.textLength > 10 ||
        result.images > 0 ||
        result.links > 0 ||
        result.titleLength > 5
      );

    debug("PLAYWRIGHT_RESULT", {
      url,
      ...result,
      isValid,
    });

    return {
      accessible: isValid,
      status: 200,
      reason: isValid ? "browser_verified" : "browser_empty_shell",
    };
  } catch (err) {
    debug("PLAYWRIGHT_ERROR", {
      url,
      error: err.message,
      code: err.code,
    });

    return {
      accessible: false,
      status: null,
      reason: err.code || "browser_failed",
    };
  } finally {
    try {
      if (page) await page.close().catch(() => {});
      if (context) await context.close().catch(() => {});
    } catch {}
  }
}

/**
 * -------------------------
 * MAIN FUNCTION
 * -------------------------
 */
exports.checkUrlAccessible = async (url) => {
  try {
    debug("START", { url });

    /**
     * STEP 1: AXIOS
     */
    try {
      const response = await axios.get(url, {
        timeout: 8000,
        maxRedirects: 5,
        validateStatus: () => true,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      });

      debug("AXIOS_RESULT", {
        url,
        status: response.status,
        htmlLength: response.data?.length,
      });

      if (
        response.status >= 200 &&
        response.status < 400 &&
        response.data &&
        !isBadHtml(response.data)
      ) {
        return {
          accessible: true,
          status: response.status,
          reason: "ok",
        };
      }
    } catch (err) {
      debug("AXIOS_ERROR", {
        url,
        error: err.message,
      });
    }

    /**
     * STEP 2: CLOUDFLARE
     */
    try {
      const cf = await cloudscraper.get(url);

      debug("CLOUDFLARE_RESULT", {
        url,
        htmlLength: cf?.length,
      });

      if (cf && !isBadHtml(cf)) {
        return {
          accessible: true,
          status: 200,
          reason: "cloudflare_bypassed",
        };
      }
    } catch (err) {
      debug("CLOUDFLARE_FAIL", {
        url,
        error: err.message,
      });
    }

    /**
     * STEP 3: PLAYWRIGHT (FINAL FALLBACK)
     */
    return await checkWithBrowser(url);
  } catch (err) {
    debug("FATAL_ERROR", {
      url,
      error: err.message,
      code: err.code,
    });

    const code = err.code || "";

    if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
      return {
        accessible: false,
        status: null,
        reason: "dns_error",
      };
    }

    if (code === "ECONNREFUSED") {
      return {
        accessible: false,
        status: null,
        reason: "connection_refused",
      };
    }

    if (code === "ETIMEDOUT") {
      return {
        accessible: false,
        status: null,
        reason: "timeout",
      };
    }

    return {
      accessible: false,
      status: null,
      reason: "request_failed",
    };
  }
};