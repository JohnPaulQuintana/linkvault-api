const { getBrowser } = require("./browser");

async function captureScreenshot(url) {
  let context;
  let page;

  try {
    const browser = await getBrowser();

    context = await browser.newContext({
      viewport: { width: 1000, height: 600 },
    });

    page = await context.newPage();

    await page
      .goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      })
      .catch(() => {});

    await page.waitForTimeout(2500);

    await page.evaluate(() => {
      window.scrollTo(0, 0);
      document.body.style.overflow = "hidden";
    });

    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const selectors = [
        ".loading",
        ".loader",
        ".spinner",
        ".skeleton",
        "#loading",
        "[class*='loading']",
        "[class*='spinner']",
        "[class*='skeleton']",
      ];

      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => el.remove());
      });
    });

    // ----------------------------------------
    // SMART VISUAL REGION DETECTION (FIX)
    // ----------------------------------------
    const elementHandle = await page.evaluateHandle(() => {
      const blocks = Array.from(
        document.querySelectorAll("div, section, main, article"),
      );

      let best = document.body;
      let bestScore = 0;

      for (const el of blocks) {
        const rect = el.getBoundingClientRect();

        if (rect.width < 200 || rect.height < 200) continue;

        const style = window.getComputedStyle(el);

        if (style.display === "none" || style.opacity === "0") continue;

        const area = rect.width * rect.height;
        const textLength = (el.innerText || "").length;
        const imgCount = el.querySelectorAll("img").length;

        let score = 0;

        // size importance
        score += area;

        // content importance
        score += textLength * 2;

        // images are strong signal (hero-like content)
        score += imgCount * 800;

        // prioritize visible top content
        if (rect.top >= 0 && rect.top < 500) {
          score += 1500;
        }

        if (score > bestScore) {
          bestScore = score;
          best = el;
        }
      }

      return best;
    });

    const element = elementHandle.asElement() || (await page.$("body"));

    const screenshot = await element.screenshot({
      type: "jpeg",
      quality: 70,
      clip: {
        x: 0,
        y: 0,
        width: 1280,
        height: 720,
      },
    });

    return screenshot;
  } catch (err) {
    console.log("Playwright error:", err.message);
    return null;
  } finally {
    try {
      if (page) await page.close();
      if (context) await context.close();
    } catch {}
  }
}

module.exports = { captureScreenshot };
