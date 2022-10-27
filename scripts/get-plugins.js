#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fetch } from "undici";

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
  const promises = packageNames.map((p) => getPackage(p));
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
  return packages;
}

async function main() {
  const packageResults = await getAllPackages();
  await writeFile(
    join("build", "packages.json"),
    JSON.stringify(packageResults),
    "utf8"
  );
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
