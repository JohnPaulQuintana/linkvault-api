exports.detectLinkType = (url) => {
  try {
    const urlObj = new URL(url);

    const hostname = urlObj.hostname
      .toLowerCase()
      .replace(/^www\./, "");

    const pathname = urlObj.pathname.toLowerCase();

    const full = `${hostname}${pathname}`;

    // =========================
    // GOOGLE ECOSYSTEM
    // =========================
    if (hostname.includes("docs.google.com")) {
      if (pathname.includes("/spreadsheets/")) {
        return "google_sheet";
      }

      if (pathname.includes("/document/")) {
        return "google_doc";
      }

      if (pathname.includes("/presentation/")) {
        return "google_slides";
      }

      if (pathname.includes("/forms/")) {
        return "google_form";
      }

      return "google_docs";
    }

    if (hostname.includes("drive.google.com")) {
      return "google_drive";
    }

    if (hostname.includes("photos.google.com")) {
      return "google_photos";
    }

    // =========================
    // MICROSOFT
    // =========================
    if (
      hostname.includes("office.com") ||
      hostname.includes("live.com")
    ) {
      return "microsoft_office";
    }

    if (hostname.includes("onedrive.live.com")) {
      return "onedrive";
    }

    // =========================
    // YOUTUBE
    // =========================
    if (
      hostname.includes("youtube.com") ||
      hostname.includes("youtu.be")
    ) {
      return "youtube";
    }

    // =========================
    // SOCIAL MEDIA
    // =========================
    if (hostname.includes("facebook.com")) {
      return "facebook";
    }

    if (hostname.includes("instagram.com")) {
      return "instagram";
    }

    if (hostname.includes("tiktok.com")) {
      return "tiktok";
    }

    if (hostname.includes("twitter.com")) {
      return "twitter";
    }

    if (hostname.includes("x.com")) {
      return "x";
    }

    if (hostname.includes("linkedin.com")) {
      return "linkedin";
    }

    if (hostname.includes("reddit.com")) {
      return "reddit";
    }

    if (hostname.includes("pinterest.com")) {
      return "pinterest";
    }

    if (hostname.includes("snapchat.com")) {
      return "snapchat";
    }

    // =========================
    // DEV / CODE
    // =========================
    if (hostname.includes("github.com")) {
      return "github";
    }

    if (hostname.includes("gitlab.com")) {
      return "gitlab";
    }

    if (hostname.includes("bitbucket.org")) {
      return "bitbucket";
    }

    if (hostname.includes("stackoverflow.com")) {
      return "stackoverflow";
    }

    if (hostname.includes("npmjs.com")) {
      return "npm";
    }

    // =========================
    // DESIGN / PRODUCTIVITY
    // =========================
    if (hostname.includes("figma.com")) {
      return "figma";
    }

    if (hostname.includes("notion.so")) {
      return "notion";
    }

    if (hostname.includes("canva.com")) {
      return "canva";
    }

    if (hostname.includes("trello.com")) {
      return "trello";
    }

    if (hostname.includes("slack.com")) {
      return "slack";
    }

    if (hostname.includes("discord.com")) {
      return "discord";
    }

    if (hostname.includes("zoom.us")) {
      return "zoom";
    }

    // =========================
    // STORAGE
    // =========================
    if (hostname.includes("dropbox.com")) {
      return "dropbox";
    }

    if (hostname.includes("mega.nz")) {
      return "mega";
    }

    if (hostname.includes("mediafire.com")) {
      return "mediafire";
    }

    // =========================
    // STREAMING
    // =========================
    if (hostname.includes("spotify.com")) {
      return "spotify";
    }

    if (hostname.includes("soundcloud.com")) {
      return "soundcloud";
    }

    if (hostname.includes("netflix.com")) {
      return "netflix";
    }

    if (hostname.includes("twitch.tv")) {
      return "twitch";
    }

    // =========================
    // SHOPPING
    // =========================
    if (hostname.includes("amazon.")) {
      return "amazon";
    }

    if (hostname.includes("shopee.")) {
      return "shopee";
    }

    if (hostname.includes("lazada.")) {
      return "lazada";
    }

    if (hostname.includes("ebay.")) {
      return "ebay";
    }

    // =========================
    // FILE TYPES
    // =========================
    if (pathname.endsWith(".pdf")) {
      return "pdf";
    }

    if (
      pathname.endsWith(".doc") ||
      pathname.endsWith(".docx")
    ) {
      return "word";
    }

    if (
      pathname.endsWith(".xls") ||
      pathname.endsWith(".xlsx")
    ) {
      return "excel";
    }

    if (
      pathname.endsWith(".ppt") ||
      pathname.endsWith(".pptx")
    ) {
      return "powerpoint";
    }

    if (
      pathname.endsWith(".zip") ||
      pathname.endsWith(".rar") ||
      pathname.endsWith(".7z")
    ) {
      return "archive";
    }

    // =========================
    // IMAGES
    // =========================
    if (
      pathname.endsWith(".png") ||
      pathname.endsWith(".jpg") ||
      pathname.endsWith(".jpeg") ||
      pathname.endsWith(".webp") ||
      pathname.endsWith(".gif") ||
      pathname.endsWith(".svg")
    ) {
      return "image";
    }

    // =========================
    // VIDEO FILES
    // =========================
    if (
      pathname.endsWith(".mp4") ||
      pathname.endsWith(".mov") ||
      pathname.endsWith(".webm")
    ) {
      return "video";
    }

    // =========================
    // AUDIO FILES
    // =========================
    if (
      pathname.endsWith(".mp3") ||
      pathname.endsWith(".wav") ||
      pathname.endsWith(".ogg")
    ) {
      return "audio";
    }

    // =========================
    // AI / CHAT
    // =========================
    if (hostname.includes("chatgpt.com")) {
      return "chatgpt";
    }

    if (hostname.includes("openai.com")) {
      return "openai";
    }

    if (hostname.includes("claude.ai")) {
      return "claude";
    }

    if (hostname.includes("gemini.google.com")) {
      return "gemini";
    }

    // =========================
    // FALLBACKS
    // =========================
    if (hostname) {
      return "website";
    }

    return "unknown";
  } catch {
    return "unknown";
  }
};