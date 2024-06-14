export const npmSearchQuery = `?text=keywords:'${[
  "sfdx-plugin",
  "sfdx plugin",
  "sf-plugin",
].join(",")}'`;

export const minPluginFields = [
  "name",
  "npmLink",
  "gitHubStargazersCount",
  "gitHubLink",
  "description",
  "authorName",
  "version",
  "pluginLibrary",
  "dependenciesCount",
];

export const minCommandFields = ["pluginName", "id", "description", "link"];

const excludeRules = [
  {
    shouldExcludePackage: (pkg) => pkg.name === "sfdx-falcon-template",
    reason:
      "this is not a plugin but a Salesforce DX project directory template",
  },
  {
    shouldExcludePackage: (pkg) => pkg.gitHubArchived === true,
    reason: "the GitHub repo is archived",
  },
  {
    shouldExcludePackage: (pkg) => pkg.gitHubFork === true,
    reason: "the GitHub repo is a fork",
  },
];

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

export function applyConfig(packages) {
  return packages
    .filter((pkg) => {
      let keep = true;
      for (const excludeRule of excludeRules) {
        if (excludeRule.shouldExcludePackage(pkg)) {
          console.error(
            `ignoring package "${pkg.name}" because of "${excludeRule.reason}"`
          );
          keep = false;
          break;
        }
      }
      return keep;
    })
    .sort(
      (a, b) =>
        -1 *
        compareWithUndefined(a?.gitHubStargazersCount, b?.gitHubStargazersCount)
    );
}
