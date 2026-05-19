// helpers/isCloudflareBlocked.js

exports.isCloudflareBlocked = (html = "") => {
  const text = html.toLowerCase();

  return (
    text.includes("cf-browser-verification") ||
    text.includes("checking your browser") ||
    text.includes("cloudflare") ||
    text.includes("attention required") ||
    text.includes("access denied")
  );
};