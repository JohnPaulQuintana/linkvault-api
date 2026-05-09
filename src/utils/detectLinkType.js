exports.detectLinkType = (url) => {
  try {
    const urlObj = new URL(url);

    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();

    // GOOGLE
    if (hostname.includes("docs.google.com")) {
      if (pathname.includes("/spreadsheets/")) {
        return "google_sheet";
      }

      if (pathname.includes("/document/")) {
        return "google_doc";
      }
    }

    if (hostname.includes("drive.google.com")) {
      return "google_drive";
    }

    // YOUTUBE
    if (
      hostname.includes("youtube.com") ||
      hostname.includes("youtu.be")
    ) {
      return "youtube";
    }

    // FIGMA
    if (hostname.includes("figma.com")) {
      return "figma";
    }

    // GITHUB
    if (hostname.includes("github.com")) {
      return "github";
    }

    // NOTION
    if (hostname.includes("notion.so")) {
      return "notion";
    }

    // DROPBOX
    if (hostname.includes("dropbox.com")) {
      return "dropbox";
    }

    // PDF
    if (pathname.endsWith(".pdf")) {
      return "pdf";
    }

    // IMAGE
    if (
      pathname.endsWith(".png") ||
      pathname.endsWith(".jpg") ||
      pathname.endsWith(".jpeg") ||
      pathname.endsWith(".webp")
    ) {
      return "image";
    }

    return "website";
  } catch {
    return "unknown";
  }
};