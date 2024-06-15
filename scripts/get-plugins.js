#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import pLimit from "p-limit";
import { applyConfig, npmSearchQuery } from "../config.js";

async function searchNpmPackages(query, results = [], size = 250, page = 0) {
  const from = size * page;
  const res = await fetch(
    `https://registry.npmjs.org/-/v1/search${query}&size=${size}&from=${from}`
  );
  const data = await res.json();
  results.push(
    ...data.objects.map((object) => {
      return {
        name: object.package.name,
        version: object.package.version,
        description: object.package.description,
        authorName: object.package.author?.name,
        npmLink: object.package.links.npm,
        gitHubLink: object.package.links.repository,
        npmScoreFinal: object.score.final,
      };
    })
  );
  if (results.length < data.total) {
    return await searchNpmPackages(query, results, size, page + 1);
  }
  return results;
}

async function getPackageDependencies(packageNames) {
  const limit = pLimit(50);
  const promises = packageNames.map((packageName) =>
    limit(async () => {
      const res = await fetch(
        `https://registry.npmjs.org/${packageName}/latest`
      );
      return await res.json();
    })
  );
  const packages = await Promise.all(promises);
  return packages.map((pkg) => {
    return {
      name: pkg.name,
      dependenciesCount: pkg.dependencies
        ? Object.keys(pkg.dependencies).length
        : 0,
      pluginLibrary: getPluginLibrary(pkg),
    };
  });
}

function getPluginLibrary(pkg) {
  if (pkg.dependencies?.["@salesforce/sf-plugins-core"]) {
    return `@salesforce/sf-plugins-core@${pkg.dependencies?.["@salesforce/sf-plugins-core"]}`;
  }
  if (pkg.dependencies?.["@salesforce/command"]) {
    return `@salesforce/command@${pkg.dependencies?.["@salesforce/command"]}`;
  }
  return "unknown";
}

async function main() {
  await mkdir(join("site", "data"), { recursive: true });
  const npmSearchResult = await searchNpmPackages(npmSearchQuery);
  await writeFile(
    join("site", "data", "npm-search-result.json"),
    JSON.stringify(npmSearchResult),
    "utf8"
  );
  const npmPackageNames = npmSearchResult.map((pkg) => pkg.name);
  const packageDependencies = await getPackageDependencies(npmPackageNames);
  const packagesWithDependencies = npmSearchResult.map((pkg) => {
    return {
      ...pkg,
      ...packageDependencies.find((deps) => deps.name === pkg.name),
    };
  });
  const result = applyConfig(packagesWithDependencies);
  await writeFile(
    join("site", "data", "packages-with-dependencies.json"),
    JSON.stringify(result),
    "utf8"
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
