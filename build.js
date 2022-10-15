import { readFile, writeFile } from "node:fs/promises";
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
  return res.json();
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

async function getManifest(plugin) {
  let result;
  const res = await fetch(`https://unpkg.com/${plugin}/.oclif.manifest.json`);
  if (res.ok) {
    return await res.json();
  }
  const res2 = await fetch(`https://unpkg.com/${plugin}/oclif.manifest.json`);
  if (res2.ok) {
    return await res2.json();
  }
  console.error(`could not get manifest for ${plugin}`);
  return null;
}

async function getCommands(plugins) {
  const promises = plugins.map((plugin) => getManifest(plugin));
  const manifests = await Promise.all(promises);
  const commands = manifests
    .map((manifest) => Object.values(manifest?.commands || {}))
    .filter(Boolean)
    .flat();
  return commands;
}

async function main() {
  const packageResults = await getAllPackages();
  await writeFile(join("build", "packages.json"), JSON.stringify(packageResults), "utf8");
  // const packageResults = JSON.parse(
  //   await readFile(join("build", "packages.json"))
  // );
  const plugins = packageResults.map((p) => p.name);
  const commands = await getCommands(plugins);
  await writeFile(
    join("build", "commands.json"),
    JSON.stringify(commands),
    "utf8"
  );
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
