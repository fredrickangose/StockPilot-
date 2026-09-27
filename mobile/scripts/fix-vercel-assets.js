// Vercel hard-excludes any deployed path containing a "node_modules" directory
// segment, with no way to override it via .vercelignore. Expo's web export puts
// hashed font/image assets under dist/assets/node_modules/... (mirroring each
// package's real node_modules location), which silently 404s once deployed
// there. This renames that folder and rewrites the matching string literals in
// the exported JS bundles so the built site never references "node_modules".
//
// Run after every `expo export -p web`, before deploying.
const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");
const oldDir = path.join(distDir, "assets", "node_modules");
const newDir = path.join(distDir, "assets", "vendor");

if (!fs.existsSync(oldDir)) {
  console.log("No dist/assets/node_modules found — nothing to fix.");
  process.exit(0);
}

fs.renameSync(oldDir, newDir);
console.log("Renamed dist/assets/node_modules -> dist/assets/vendor");

const jsDir = path.join(distDir, "_expo", "static", "js", "web");
const files = fs.existsSync(jsDir) ? fs.readdirSync(jsDir).filter((f) => f.endsWith(".js")) : [];

let totalReplacements = 0;
for (const file of files) {
  const filePath = path.join(jsDir, file);
  const content = fs.readFileSync(filePath, "utf8");
  const matches = content.match(/assets\/node_modules/g);
  if (!matches) continue;
  const updated = content.split("assets/node_modules").join("assets/vendor");
  fs.writeFileSync(filePath, updated);
  totalReplacements += matches.length;
  console.log(`Rewrote ${matches.length} reference(s) in ${file}`);
}

if (totalReplacements === 0) {
  console.warn("Warning: renamed the folder but found no JS references to rewrite — check manually.");
} else {
  console.log(`Done. ${totalReplacements} total reference(s) fixed.`);
}
