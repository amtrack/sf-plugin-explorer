#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import pLimit from "p-limit";

async function getOclifManifest(plugin) {
  const urls = [
    `https://unpkg.com/${plugin.name}/.oclif.manifest.json`,
    `https://unpkg.com/${plugin.name}/oclif.manifest.json`,
  ];
  for (const url of urls) {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        link: plugin.link,
      };
    }
  }
  console.error(`could not get manifest for ${plugin.name}`);
  return null;
}

async function getCommands(plugins) {
  const limit = pLimit(50);
  const promises = plugins.map((plugin) =>
    limit(() => getOclifManifest(plugin))
  );
  const manifests = await Promise.all(promises);
  const commands = manifests
    .map((manifest) =>
      (manifest?.commands ? Object.values(manifest.commands) : []).map(
        (cmd) => ({
          ...cmd,
          description: cmd.summary ?? cmd.description,
          link: manifest.link,
        })
      )
    )
    .filter(Boolean)
    .flat();
  return commands;
}

async function main() {
  await mkdir(join("site", "data"), { recursive: true });
  const packageResults = JSON.parse(
    await readFile(
      join("site", "data", "packages-with-dependencies-and-github.json")
    )
  );
  const commands = await getCommands(packageResults);
  await writeFile(
    join("site", "data", "commands.json"),
    JSON.stringify(commands),
    "utf8"
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
