#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const packageFields = [
  "name",
  "gitHubStargazersCount",
  "description",
  "author",
  "version",
  "dependencies",
  "homepage",
  "repository",
  "bugs",
];

const commandFields = ["pluginName", "id", "description"];

async function main() {
  const packages = JSON.parse(
    await readFile(join("site", "data", "packages.json"))
  );
  const minPackages = packages.map((pkg) =>
    Object.fromEntries(
      Object.entries(pkg).filter(([key, value]) => packageFields.includes(key))
    )
  );
  const commands = JSON.parse(
    await readFile(join("site", "data", "commands.json"))
  );
  const minCommands = commands.map((cmd) =>
    Object.fromEntries(
      Object.entries(cmd).filter(([key, value]) => commandFields.includes(key))
    )
  );
  await mkdir(join("site", "data"), { recursive: true });
  await writeFile(
    join("site", "data", "packages.min.json"),
    JSON.stringify(minPackages),
    "utf8"
  );
  await writeFile(
    join("site", "data", "commands.min.json"),
    JSON.stringify(minCommands),
    "utf8"
  );
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
