const pLimit = require("p-limit");

// adjust based on server RAM
// 2GB RAM → 2
// 4GB RAM → 4-6
const limit = pLimit(3);

function runLimited(fn) {
  return limit(() => fn());
}

module.exports = { runLimited };