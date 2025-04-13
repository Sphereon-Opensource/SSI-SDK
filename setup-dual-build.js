const fs = require("fs");
const path = require("path");

const PACKAGES_DIR = path.join(__dirname, "packages");
const ROOT_PACKAGE_JSON = path.join(__dirname, "package.json");

function updatePackageJson(pkgPath) {
  const pkgJsonPath = path.join(pkgPath, "package.json");

  if (!fs.existsSync(pkgJsonPath)) return;

  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));

  // Clean up any existing build script
  if (pkg.scripts && pkg.scripts.build) {
    delete pkg.scripts.build;
  }

  // Ensure scripts object exists
  pkg.scripts = pkg.scripts || {};

  // Output fields
  pkg.main = "dist/cjs/index.js";
  pkg.module = "dist/esm/index.js";
  pkg.types = "dist/esm/index.d.ts";

  // Exports field
  pkg.exports = {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js"
    }
  };

  // Save updated package.json
  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2));
  console.log(`✅ Updated ${pkg.name}`);
}

function updateRootBuildScript() {
  if (!fs.existsSync(ROOT_PACKAGE_JSON)) return;

  const rootPkg = JSON.parse(fs.readFileSync(ROOT_PACKAGE_JSON, "utf-8"));
  rootPkg.scripts = rootPkg.scripts || {};
  rootPkg.scripts.build = "pnpm -r exec tsup";

  fs.writeFileSync(ROOT_PACKAGE_JSON, JSON.stringify(rootPkg, null, 2));
  console.log("📦 Root package.json build script updated");
}

function main() {
  const packages = fs.readdirSync(PACKAGES_DIR);

  packages.forEach((pkgName) => {
    const pkgPath = path.join(PACKAGES_DIR, pkgName);
    const stats = fs.statSync(pkgPath);
    if (stats.isDirectory()) {
      updatePackageJson(pkgPath);
    }
  });

  updateRootBuildScript();

  console.log("\n🚀 Dual-format ESM+CJS support is now configured using global tsup config!");
}

main();
