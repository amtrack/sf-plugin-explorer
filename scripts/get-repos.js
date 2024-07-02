#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import pLimit from "p-limit";
import { getGitHubSlug } from "../utils.js";

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
  const plugins = JSON.parse(await readFile(join(".tmp", "packages.json")));
  const gitHubSlugs = plugins.map((pkg) => getGitHubSlug(pkg)).filter(Boolean);
  const limit = pLimit(10);
  const repos = await Promise.all(
    gitHubSlugs.map((slug) => limit(() => getRepoInfo(slug)))
  );
  await writeFile(join(".tmp", "repos.json"), JSON.stringify(repos), "utf8");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
