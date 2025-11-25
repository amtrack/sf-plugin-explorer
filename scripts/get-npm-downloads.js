#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import pLimit from "p-limit";

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

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

async function getNpmDownloads(packageNames) {
  const [scopedPackages, unscopedPackages] = partitionPackages(packageNames);
  const limit = pLimit(1);
  const promises = [...chunk(unscopedPackages, 128), ...scopedPackages].map(
    (job) =>
      limit(async () => {
        const results = await fetchBulkDownloads(job);
        await new Promise((resolve) => setTimeout(resolve, 1_500));
        return results;
      })
  );
  return (await Promise.all(promises)).flat();
}

function partitionPackages(packages) {
  return [
    packages.filter((pkg) => pkg.startsWith("@")), // scoped
    packages.filter((pkg) => !pkg.startsWith("@")), // unscoped
  ];
}

function chunk(input, size) {
  const result = [];
  for (let i = 0; i < input.length; i += size) {
    result.push(input.slice(i, i + size));
  }
  return result;
}

// https://github.com/npm/registry/blob/main/docs/download-counts.md#bulk-queries
async function fetchBulkDownloads(packageNames) {
  packageNames = Array.isArray(packageNames) ? packageNames : [packageNames];
  const packageNameList = packageNames.join(",");
  console.error(`Fetching NPM download count for ${packageNameList}`);
  const res = await fetch(
    `https://api.npmjs.org/downloads/point/last-week/${packageNameList}`
  );
  if (!res.ok) {
    throw new Error(
      `Fetching NPM download count failed for ${packageNameList}`,
      {
        cause: new Error(
          `${res.status} ${res.statusText}: ${await res.json()}`
        ),
      }
    );
  }
  const data = await res.json();
  const infos = packageNames.length === 1 ? [data] : Object.values(data);
  return infos.map((info) => ({
    package: info.package,
    downloads: info.downloads,
  }));
}
