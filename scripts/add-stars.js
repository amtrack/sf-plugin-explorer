#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

function getGitHubSlug(repositoryUrl) {
  if (repositoryUrl === undefined) {
    return undefined;
  }
  try {
    const url = new URL(repositoryUrl);
    if (url.hostname === "github.com") {
      const slug = url.pathname.replace(/^\//, "").replace(/\.git$/, "");
      return slug;
    }
  } catch (e) {
    return undefined;
  }
}

async function fetchStars(slug) {
  const res = await fetch(`https://api.github.com/repos/${slug}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
  });
  const json = await res.json();
  return json.stargazers_count;
}

async function addStarsToPackage(pkg) {
  const gitHubSlug = getGitHubSlug(pkg.repository?.url);
  if (gitHubSlug !== undefined) {
    pkg.gitHubSlug = gitHubSlug;
    const stargazersCount = await fetchStars(gitHubSlug);
    if (stargazersCount !== undefined) {
      pkg.gitHubStargazersCount = stargazersCount;
    }
  }
  return pkg;
}

async function addStarsToPackages(packages) {
  const result = await Promise.all(
    packages.map((pkg) => addStarsToPackage(pkg))
  );
  return result;
}

function compareWithUndefined(a, b) {
  if (a === b) {
    return 0;
  }
  if (a === undefined) {
    return -1;
  }
  if (b === undefined) {
    return 1;
  }
  return a - b;
}

async function main() {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("Environment variable GITHUB_TOKEN is mandatory.");
  }
  await mkdir(join("site", "data"), { recursive: true });
  const packages = JSON.parse(
    await readFile(join("site", "data", "packages.json"))
  );
  const result = await addStarsToPackages(packages);
  const sorted = result.sort(
    (a, b) =>
      -1 *
      compareWithUndefined(a?.gitHubStargazersCount, b?.gitHubStargazersCount)
  );
  await writeFile(
    join("site", "data", "packages.json"),
    JSON.stringify(sorted),
    "utf8"
  );
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
