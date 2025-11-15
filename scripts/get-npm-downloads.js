#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import pLimit from "p-limit";

async function getNpmDownloads(packageNames) {
  const limit = pLimit(1);
  const promises = packageNames.map((packageName) =>
    limit(async () => {
      const res = await fetch(
        `https://api.npmjs.org/downloads/point/last-week/${packageName}`
      );
      if (!res.ok) {
        throw new Error(
          `Fetching NPM download count failed for package ${packageName}`,
          {
            cause: new Error(
              `${res.status} ${res.statusText}: ${await res.text()}`
            ),
          }
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      return await res.json();
    })
  );
  const downloads = await Promise.all(promises);
  return downloads.map((pkg) => {
    return {
      name: pkg.package,
      npmDownloads: pkg.downloads,
    };
  });
}

async function main() {
  const packages = JSON.parse(await readFile(join(".tmp", "packages.json")));
  const npmPackageNames = packages.map((pkg) => pkg.name);
  const downloads = await getNpmDownloads(npmPackageNames);
  await writeFile(
    join(".tmp", "npm-downloads.json"),
    JSON.stringify(downloads),
    "utf8"
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
