#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { minPluginFields, minCommandFields } from "../config.js";

function pick(arr, fields) {
  return arr.map((obj) =>
    Object.fromEntries(
      Object.entries(obj).filter(([key, _]) => fields.includes(key))
    )
  );
}

async function main() {
  const packages = JSON.parse(
    await readFile(
      join("site", "data", "packages-with-dependencies-and-github.json")
    )
  );
  const minPackages = pick(packages, minPluginFields);
  const commands = JSON.parse(
    await readFile(join("site", "data", "commands.json"))
  );
  const minCommands = pick(commands, minCommandFields);

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
  console.error(e);
  process.exitCode = 1;
});
