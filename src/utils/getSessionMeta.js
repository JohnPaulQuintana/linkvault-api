const UAParser = require("ua-parser-js");

/**
 * Extract session metadata from Express request
 */
const getSessionMeta = (req) => {
  const userAgent = req.headers["user-agent"] || null;

  // IP extraction (works behind proxy + local dev)
  const ipAddress =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    null;

  let deviceName = null;
  let os = null;
  let browser = null;

  if (userAgent) {
    const parser = new UAParser(userAgent);

    const device = parser.getDevice();
    os = parser.getOS();
    browser = parser.getBrowser();

    // Build readable name
    deviceName =
      `${os.name || "Unknown OS"} ` +
      `| ${browser.name || "Unknown Browser"} ` +
      `| ${device.model || "Web/Unknown Device"}`;
  }

  return {
    userAgent,
    ipAddress,
    deviceName,
    os: os?.name || null,
    browser: browser?.name || null,
  };
};

module.exports = { getSessionMeta };