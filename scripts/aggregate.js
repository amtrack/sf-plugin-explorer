#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { excludeRules, minCommandFields, minPluginFields } from "../config.js";
import { applyConfig, getGitHubSlug } from "../utils.js";

function pick(arr, fields) {
  return arr.map((obj) =>
    Object.fromEntries(
      Object.entries(obj).filter(([key, _]) => fields.includes(key))
    )
  );
}

async function buildPlugins() {
  const packages = JSON.parse(await readFile(join(".tmp", "packages.json")));
  const dependencies = JSON.parse(
    await readFile(join(".tmp", "package-dependencies.json"))
  );
  const downloads = JSON.parse(
    await readFile(join(".tmp", "npm-downloads.json"))
  );
  const repos = JSON.parse(await readFile(join(".tmp", "repos.json")));
  const plugins = applyConfig(
    packages.map((pkg) => {
      return {
        ...pkg,
        ...downloads.find((download) => download.name === pkg.name),
        ...dependencies.find((deps) => deps.name === pkg.name),
        ...repos.find((repo) => repo.gitHubSlug === getGitHubSlug(pkg)),
      };
    }),
    { excludeRules }
  );
  const minPlugins = pick(plugins, minPluginFields);
  await writeFile(
    join("site", "data", "plugins.min.json"),
    JSON.stringify(minPlugins),
    "utf8"
  );
}

async function buildCommands() {
  const commands = JSON.parse(await readFile(join(".tmp", "commands.json")));
  const minCommands = pick(commands, minCommandFields);
  await writeFile(
    join("site", "data", "commands.min.json"),
    JSON.stringify(minCommands),
    "utf8"
  );
}

async function buildMeta() {
  const meta = {
    lastUpdated: new Date().toISOString(),
    source: "https://github.com/amtrack/sf-plugin-explorer",
  };
  await writeFile(
    join("site", "data", "meta.json"),
    JSON.stringify(meta),
    "utf8"
  );
}

async function main() {
  await mkdir(join("site", "data"), { recursive: true });
  await buildPlugins();
  await buildCommands();
  await buildMeta();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
