#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import pLimit from "p-limit";

async function getPackageDependencies(packageNames) {
  const limit = pLimit(50);
  const promises = packageNames.map((packageName) =>
    limit(async () => {
      const res = await fetch(
        `https://registry.npmjs.org/${packageName}/latest`
      );
      if (!res.ok) {
        throw new Error(
          `Fetching NPM package dependencies failed for package ${packageName}`,
          {
            cause: new Error(
              `${res.status} ${res.statusText}: ${await res.text()}`
            ),
          }
        );
      }
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
  const packages = JSON.parse(await readFile(join(".tmp", "packages.json")));
  const npmPackageNames = packages.map((pkg) => pkg.name);
  const dependencies = await getPackageDependencies(npmPackageNames);
  await writeFile(
    join(".tmp", "package-dependencies.json"),
    JSON.stringify(dependencies),
    "utf8"
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
