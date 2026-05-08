exports.normalizeUrl = (url) => {
  if (!url.startsWith("http")) {
    return "https://" + url;
  }
  return url;
};