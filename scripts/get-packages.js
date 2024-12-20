#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { npmSearchQuery } from "../config.js";

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
        date: object.package.date,
        description: object.package.description,
        authorName: object.package.publisher.username,
        npmLink: object.package.links.npm,
        gitHubLink: object.package.links.repository,
        npmScoreFinal: object.score.final,
      };
    })
  );
  console.debug({ results: results.length, total: data.total });
  if (results.length < data.total) {
    return await searchNpmPackages(query, results, size, page + 1);
  }
  return results;
}

async function main() {
  const packages = await searchNpmPackages(npmSearchQuery);
  await writeFile(
    join(".tmp", "packages.json"),
    JSON.stringify(packages),
    "utf8"
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
