#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
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
    limit(async () => {
      const manifest = await getOclifManifest(plugin);
      if (manifest?.commands) {
        return Object.values(manifest.commands)
          .filter((cmd) => !cmd.hidden)
          .map((cmd) => ({
            ...cmd,
            description: cmd.summary ?? cmd.description,
            link: plugin.npmLink,
          }));
      }
      return [];
    })
  );
  const allCommands = (await Promise.all(promises)).flat().filter(Boolean);
  return allCommands;
}

async function main() {
  const packageResults = JSON.parse(
    await readFile(join(".tmp", "packages.json"))
  );
  const commands = await getCommands(packageResults);
  await writeFile(
    join(".tmp", "commands.json"),
    JSON.stringify(commands),
    "utf8"
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
