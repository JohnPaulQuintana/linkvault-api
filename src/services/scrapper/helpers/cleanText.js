exports.cleanText = (text) => {
  if (!text) return null;

  return text
    .replace(/\s+/g, " ")
    .replace(/[\n\r\t]/g, " ")
    .trim();
};