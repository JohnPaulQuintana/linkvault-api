// helpers/resolveUrl.js

exports.resolveUrl = (base, src) => {
  try {
    if (!src) return null;

    if (src.startsWith("http")) return src;

    if (src.startsWith("//")) {
      return "https:" + src;
    }

    return new URL(src, base).href;
  } catch {
    return null;
  }
};