const { chromium } = require("playwright");

let browser;
let requestCount = 0;

async function getBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
  }

  requestCount++;

  // auto-restart browser every 500 requests (prevents memory leak)
  if (requestCount > 500) {
    try {
      await browser.close();
    } catch {}

    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    requestCount = 0;
  }

  return browser;
}

module.exports = { getBrowser };