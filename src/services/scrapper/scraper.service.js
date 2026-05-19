const {
  generateWebsiteContent,
} = require("./generators/website.generator");

const {
  generateSocialMeta,
} = require("./generators/social.generator");

const {
  generateDevMeta,
} = require("./generators/dev.generator");

const {
  generateProductivityMeta,
} = require("./generators/productivity.generator");

const {
  generateMediaMeta,
} = require("./generators/media.generator");

const {
  generateShoppingMeta,
} = require("./generators/shopping.generator");

const {
  generateFileMeta,
} = require("./generators/file.generator");

const {
  generateAIMeta,
} = require("./generators/ai.generator");

const {
  generateYoutubeMeta,
} = require("./generators/youtube.generator");

/**
 * -------------------------
 * TYPE ROUTER
 * -------------------------
 */

exports.generateTypedContent = async (
  url,
  type,
) => {
  switch (type) {
    // =====================
    // WEBSITE
    // =====================

    case "website":
      return generateWebsiteContent(url, type);

    // =====================
    // YOUTUBE
    // =====================

    case "youtube":
      return generateYoutubeMeta(url, type);

    // =====================
    // SOCIAL
    // =====================

    case "facebook":
    case "instagram":
    case "tiktok":
    case "twitter":
    case "x":
    case "linkedin":
    case "reddit":
    case "pinterest":
    case "snapchat":
      return generateSocialMeta(url, type);

    // =====================
    // GOOGLE
    // =====================

    case "google_sheet":
    case "google_doc":
    case "google_slides":
    case "google_form":
    case "google_docs":
    case "google_drive":
    case "google_photos":
      return generateGoogleMeta(url, type);

    // =====================
    // DEV
    // =====================

    case "github":
    case "gitlab":
    case "bitbucket":
    case "stackoverflow":
    case "npm":
      return generateDevMeta(url, type);

    // =====================
    // PRODUCTIVITY
    // =====================

    case "figma":
    case "notion":
    case "canva":
    case "trello":
    case "slack":
    case "discord":
    case "zoom":
      return generateProductivityMeta(
        url,
        type,
      );

    // =====================
    // STORAGE
    // =====================

    case "dropbox":
    case "mega":
    case "mediafire":
    case "onedrive":
      return generateStorageMeta(url, type);

    // =====================
    // MEDIA
    // =====================

    case "spotify":
    case "soundcloud":
    case "netflix":
    case "twitch":
      return generateMediaMeta(url, type);

    // =====================
    // SHOPPING
    // =====================

    case "amazon":
    case "shopee":
    case "lazada":
    case "ebay":
      return generateShoppingMeta(url, type);

    // =====================
    // FILES
    // =====================

    case "pdf":
    case "word":
    case "excel":
    case "powerpoint":
    case "archive":
    case "image":
    case "video":
    case "audio":
      return generateFileMeta(url, type);

    // =====================
    // AI
    // =====================

    case "chatgpt":
    case "openai":
    case "claude":
    case "gemini":
      return generateAIMeta(url, type);

    // =====================
    // FALLBACK
    // =====================

    default:
      return generateWebsiteContent(url, type);
  }
};