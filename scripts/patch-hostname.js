// Monkey-patch os.hostname() to return ASCII-safe name
const os = require("os");
const origHostname = os.hostname;
os.hostname = function () {
  const h = origHostname.call(this);
  // If hostname contains non-ASCII chars, replace with 'legion'
  if (/[^\x00-\x7F]/.test(h)) return "legion";
  return h;
};
