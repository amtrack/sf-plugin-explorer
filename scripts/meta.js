#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { join } from "node:path";

async function main() {
  const data = {
    lastUpdated: new Date().toISOString(),
    source: "https://github.com/amtrack/sf-plugin-explorer",
  };
  await writeFile(
    join("site", "data", "meta.json"),
    JSON.stringify(data),
    "utf8"
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
