#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fetch } from "undici";

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
  const packageResults = JSON.parse(
    await readFile(join("build", "packages.json"))
  );
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
