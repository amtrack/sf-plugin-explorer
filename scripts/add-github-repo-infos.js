#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import pLimit from "p-limit";
import { applyConfig } from "../config.js";

function getGitHubSlug(pkg) {
  if (pkg.gitHubLink === undefined) {
    return undefined;
  }
  try {
    const url = new URL(pkg.gitHubLink);
    if (url.hostname === "github.com") {
      const slug = url.pathname.replace(/^\//, "").replace(/\.git$/, "");
      return slug;
    }
  } catch (_) {
    return undefined;
  }
}

async function getRepoInfo(slug) {
  const res = await fetch(`https://api.github.com/repos/${slug}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
  });
  const json = await res.json();
  return {
    gitHubSlug: slug,
    gitHubStargazersCount: json.stargazers_count,
    gitHubArchived: json.archived,
    gitHubFork: json.fork,
  };
}

async function main() {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("Environment variable GITHUB_TOKEN is mandatory.");
  }
  await mkdir(join("site", "data"), { recursive: true });
  const packages = JSON.parse(
    await readFile(join("site", "data", "packages-with-dependencies.json"))
  );

  const gitHubSlugs = packages.map((pkg) => getGitHubSlug(pkg)).filter(Boolean);
  const limit = pLimit(10);
  const repos = await Promise.all(
    gitHubSlugs.map((slug) => limit(() => getRepoInfo(slug)))
  );

  await writeFile(
    join("site", "data", "repos.json"),
    JSON.stringify(repos),
    "utf8"
  );

  const packagesWithDependenciesAndRepos = packages.map((pkg) => {
    return {
      ...pkg,
      ...repos.find((repo) => repo.gitHubSlug === getGitHubSlug(pkg)),
    };
  });

  const result = applyConfig(packagesWithDependenciesAndRepos);
  await writeFile(
    join("site", "data", "packages-with-dependencies-and-github.json"),
    JSON.stringify(result),
    "utf8"
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
