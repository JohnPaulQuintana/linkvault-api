const { getDomain } = require("../../services/scrapper/helpers/getDomain");

/**
 * -------------------------
 * SAFETY ENGINE v4
 * -------------------------
 */

// =========================
// CONFIG
// =========================
const unsafeKeywords = [
  "porn",
  "xxx",
  "sex",
  "adult",
  "nsfw",
  "casino",
  "bet",
  "hack",
  "crack",
  "phishing",
  "scam",
  "malware",
  "virus",
];

const suspiciousKeywords = [
  "free money",
  "crypto giveaway",
  "win iphone",
  "airdrop bonus",
  "click here",
  "limited time",
];

// risky TLDs
const riskyTlds = [
  ".xyz",
  ".top",
  ".click",
  ".monster",
  ".work",
  ".zip",
  ".loan",
];

// =========================
// NORMALIZATION (ANTI-BYPASS)
// =========================
const normalizeText = (text = "") => {
  return text
    .toLowerCase()
    // leetspeak
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    // remove separators (important for x-x-x bypass)
    .replace(/[\s._\-\/]/g, "");
};

// =========================
// PATTERN DETECTION
// =========================
const unsafePatterns = [
  /x{2,}/,          // xx, xxx, xxxx
  /p+o+r+n/,        // porn obfuscation
  /s+e+x/,          // sex obfuscation
  /a+d+u+l+t/,      // adult obfuscation
];

// =========================
// KEYWORD SCAN
// =========================
const checkKeywordRisk = (text = "") => {
  const raw = text.toLowerCase();
  const normalized = normalizeText(text);

  // direct unsafe keywords
  if (unsafeKeywords.some((k) => raw.includes(k))) {
    return "unsafe";
  }

  // suspicious phrases
  if (suspiciousKeywords.some((k) => raw.includes(k))) {
    return "suspicious";
  }

  // normalized bypass check (p0rn → porn, x x x → xxx)
  if (unsafeKeywords.some((k) => normalized.includes(k))) {
    return "unsafe";
  }

  // pattern-based detection
  if (unsafePatterns.some((p) => p.test(normalized))) {
    return "unsafe";
  }

  return "safe";
};

// =========================
// DOMAIN CHECK
// =========================
const checkDomainRisk = (domain = "") => {
  const d = domain.toLowerCase();

  if (riskyTlds.some((tld) => d.endsWith(tld))) {
    return "suspicious";
  }

  return "safe";
};

// =========================
// URL STRUCTURE CHECK (PHISHING)
// =========================
const checkUrlRisk = (url = "") => {
  try {
    const u = new URL(url);

    const hostname = u.hostname.toLowerCase();

    const flags = [
      hostname.split(".").length > 4, // too many subdomains
      u.href.includes("@"), // phishing trick
      u.href.length > 120, // long tracking URL
      /(\d+\.){3}\d+/.test(hostname), // IP address
      hostname.includes("xn--"), // punycode spoofing
    ];

    return flags.some(Boolean) ? "suspicious" : "safe";
  } catch {
    return "suspicious";
  }
};

/**
 * -------------------------
 * MAIN SAFETY ENGINE
 * -------------------------
 */
exports.detectSafety = (payload) => {
  const { url, title = "", description = "" } = payload;

  const domain = getDomain(url);

  const combinedText = `${domain} ${title} ${description}`;

  const keywordResult = checkKeywordRisk(combinedText);
  const domainResult = checkDomainRisk(domain);
  const urlResult = checkUrlRisk(url);

  const signals = [keywordResult, domainResult, urlResult];

  // =========================
  // FINAL DECISION ENGINE
  // =========================
  if (signals.includes("unsafe")) {
    return {
      status: "unsafe",
      reason: "high-risk content detected",
      signals,
    };
  }

  if (signals.includes("suspicious")) {
    return {
      status: "suspicious",
      reason: "risk indicators detected",
      signals,
    };
  }

  return {
    status: "safe",
    reason: "clean",
    signals,
  };
};