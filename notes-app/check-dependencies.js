// Checks whether this machine's network can reach the npm registry for every
// package this project needs, WITHOUT actually installing anything. Run this
// before "npm install" on a new/locked-down machine (e.g. a corporate
// laptop) to find out up front whether the install will work at all.
//
// Usage:  node check-dependencies.js

import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf-8"));
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
const packageNames = Object.keys(allDeps);

const SSL_ERROR_CODES = new Set([
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "CERT_HAS_EXPIRED",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "CERT_UNTRUSTED",
]);

function checkPackage(name) {
  return new Promise((resolve) => {
    const url = `https://registry.npmjs.org/${name.replace("/", "%2F")}`;
    const req = https.get(url, { timeout: 10000 }, (res) => {
      res.resume(); // discard body, we only care about the status code
      resolve({ name, ok: res.statusCode === 200, detail: `HTTP ${res.statusCode}` });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve({ name, ok: false, detail: "timed out" });
    });
    req.on("error", (err) => resolve({ name, ok: false, detail: err.code || err.message }));
  });
}

(async () => {
  console.log(`Node version: ${process.version}`);
  console.log(`Checking network access to registry.npmjs.org for ${packageNames.length} packages...\n`);

  const results = [];
  for (const name of packageNames) {
    const result = await checkPackage(name);
    results.push(result);
    console.log(`  ${result.ok ? "OK  " : "FAIL"}  ${name}${result.ok ? "" : `  (${result.detail})`}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log("\n----------------------------------------");

  if (failed.length === 0) {
    console.log(`All ${results.length} packages reachable. "npm install" should work on this network.`);
    process.exit(0);
  }

  console.log(`${failed.length} of ${results.length} packages could NOT be reached.`);

  const sslIssue = failed.some((r) => SSL_ERROR_CODES.has(r.detail));
  if (sslIssue) {
    console.log(`
This looks like SSL interception — something on this network or machine
(a corporate proxy, or antivirus like Norton doing "SSL scanning") is
intercepting HTTPS traffic, and Node doesn't trust the certificate it's
presenting. This is a known issue, not a sign the packages are unavailable.

Fix: get that root certificate exported to a .pem file (ask IT, or find it
in Windows' certificate store under "Trusted Root Certification
Authorities"), then run:

  $env:NODE_EXTRA_CA_CERTS = "C:\\path\\to\\that-root-cert.pem"

...and re-run this script (or "npm install") in the same terminal session.
`);
  } else {
    console.log(`
This looks like a network/firewall block on the npm registry itself rather
than an SSL issue. Check with IT whether "registry.npmjs.org" is reachable
from this network — if it's blocked outright, "npm install" will not work
here regardless of certificate fixes.
`);
  }
  process.exit(1);
})();
