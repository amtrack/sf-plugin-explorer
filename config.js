import { getGitHubSlug } from "./utils.js";

// fork = same GitHub repo + same unscoped name, but fewer downloads (e.g. @danielcalle/sfdx-scanner vs @salesforce/sfdx-scanner)
function findOriginal(pkg, all) {
  if (getGitHubSlug(pkg) === undefined) return undefined;
  return all.find(
    (other) =>
      getGitHubSlug(other)?.toLowerCase() === getGitHubSlug(pkg).toLowerCase() &&
      other.name.split("/").pop() === pkg.name.split("/").pop() &&
      other.npmDownloads > pkg.npmDownloads,
  );
}

export const npmSearchQueries = ["sfdx-plugin", "sf-plugin"].map((k) => `?text=keywords:'${k}'`);

export const minPluginFields = [
  "name",
  "npmLink",
  "gitHubStargazersCount",
  "gitHubLink",
  "npmDownloads",
  "description",
  "authorName",
  "version",
  "date",
  "pluginLibrary",
  "dependenciesCount",
];

export const minCommandFields = ["pluginName", "id", "description", "link"];

export const excludeRules = [
  {
    shouldExcludePackage: (pkg) => pkg.name === "sfdx-falcon-template",
    reason: "this is not a plugin but a Salesforce DX project directory template",
  },
  {
    shouldExcludePackage: (pkg, all) => findOriginal(pkg, all) !== undefined,
    reason: (pkg, all) => `this is a fork of "${findOriginal(pkg, all).name}"`,
  },
];
