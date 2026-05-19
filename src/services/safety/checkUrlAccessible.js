// services/link/helpers/checkUrlAccessible.js

const axios = require("axios");
const cloudscraper = require("cloudscraper");

exports.checkUrlAccessible = async (url) => {
  try {
    /**
     * =========================
     * FAST HEAD REQUEST
     * =========================
     */
    const response = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: () => true,

      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    const status = response.status;

    // =========================
    // VALID SUCCESS
    // =========================
    if (status >= 200 && status < 400) {
      return {
        accessible: true,
        status,
        reason: "ok",
      };
    }

    // =========================
    // CLOUDFLARE / BLOCKED
    // =========================
    if ([403, 429, 503].includes(status)) {
      try {
        await cloudscraper.get(url);

        return {
          accessible: true,
          status,
          reason: "cloudflare_bypassed",
        };
      } catch {
        return {
          accessible: false,
          status,
          reason: "blocked",
        };
      }
    }

    // =========================
    // CLIENT ERRORS
    // =========================
    if (status >= 400 && status < 500) {
      return {
        accessible: false,
        status,
        reason: "not_found",
      };
    }

    // =========================
    // SERVER ERRORS
    // =========================
    if (status >= 500) {
      return {
        accessible: false,
        status,
        reason: "server_error",
      };
    }

    return {
      accessible: false,
      status,
      reason: "unknown",
    };
  } catch (err) {
    const code = err.code || "";

    // =========================
    // NETWORK ERRORS
    // =========================
    if (
      code === "ENOTFOUND" ||
      code === "EAI_AGAIN"
    ) {
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