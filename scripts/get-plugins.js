#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import pLimit from "p-limit";

const additionalPackages = [];
const ignoredPackages = [];

async function searchPackages(results = [], size = 250, page = 0) {
  const from = size * page;
  const res = await fetch(
    `https://registry.npmjs.org/-/v1/search?text=not:deprecated+keywords:"sfdx-plugin,sfdx plugin"&size=${size}&from=${from}`
  );
  const data = await res.json();
  results.push(...data.objects);
  if (results.length < data.total) {
    return await searchPackages(results, size, page + 1);
  }
  return results;
}

async function getPackage(packageName) {
  const res = await fetch(`https://registry.npmjs.org/${packageName}`);
  return await res.json();
}

async function getPackages(packageNames) {
  const limit = pLimit(50);
  const promises = packageNames.map((p) => limit(() => getPackage(p)));
  const packages = await Promise.all(promises);
  return packages;
}

export async function getAllPackages() {
  const packageNames = [
    ...(await searchPackages()).map(
      (packageResult) =>
        packageResult.package.name + "/" + packageResult.package.version
    ),
    ...additionalPackages,
  ];
  const filteredPackageNames = packageNames.filter(
    (p) => !ignoredPackages.includes(p)
  );
  const packages = await getPackages(filteredPackageNames);
  return packages.map((pkg) => ({
    ...pkg,
    link: getLink(pkg),
  }));
}

async function main() {
  const packageResults = await getAllPackages();
  await mkdir(join("site", "data"), { recursive: true });
  await writeFile(
    join("site", "data", "packages.json"),
    JSON.stringify(packageResults),
    "utf8"
  );
}

function getLink(pkg) {
  if (pkg?.homepage) {
    return pkg?.homepage;
  }
  if (pkg?.repository?.url) {
    return pkg?.repository?.url;
  }
  if (pkg?.bugs?.url) {
    return pkg?.bugs?.url;
  }
  return `https://npmjs.com/package/${pkg.name}`;
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
