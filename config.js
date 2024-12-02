export const npmSearchQuery = `?text=keywords:'${[
  "sfdx-plugin",
  "sf-plugin",
].join(",")}'`;

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
    reason:
      "this is not a plugin but a Salesforce DX project directory template",
  },
];
