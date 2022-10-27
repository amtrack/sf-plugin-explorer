#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fetch } from "undici";

function getGitHubSlug(repositoryUrl) {
  if (repositoryUrl === undefined) {
    return undefined;
  }
  try {
    const url = new URL(url);
    if (url.hostname === "github.com") {
      return url.pathname.remove(/^\//).remove(/\.git$/);
    }
  } catch (e) {
    return undefined;
  }
}

async function fetchStars(slug) {
  const res = await fetch(`https://api.github.com/repos/${slug}`);
  const json = await res.json();
  return json.stargazers_count;
}

async function addStars(packages) {
  const packagesIncludingGithubSlug = packages.map((pkg) => {
    const gitHubSlug = getGitHubSlug(pkg.repository?.url);
    return {
      ...pkg,
      ...(gitHubSlug && { gitHubSlug }),
    };
  });
  const gitHubStars = await Promise.all(
    packagesIncludingGithubSlug
      .filter((pkg) => pkg.gitHubSlug !== undefined)
      .map((pkg) => fetchStars(pkg))
  );
  const result = packagesIncludingGithubSlug.map((pkg) => {
    const stargazersCount = gitHubStars[pkg?.gitHubSlug];
    return {
      ...pkg,
      ...(stargazersCount !== undefined && { stargazersCount }),
    };
  });
  return result;
}

async function main() {
  const packages = JSON.parse(await readFile(join("build", "packages.json")));
  const result = await addStars(packages);
  await writeFile(
    join("build", "packages.json"),
    JSON.stringify(result),
    "utf8"
  );
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
