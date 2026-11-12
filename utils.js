export function compareWithUndefined(a, b) {
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

export function applyConfig(packages, config) {
  return packages
    .filter((pkg, _, all) => {
      let keep = true;
      for (const excludeRule of config.excludeRules) {
        if (excludeRule.shouldExcludePackage(pkg, all)) {
          console.error(
            `ignoring package "${pkg.name}" because ${typeof excludeRule.reason === "function" ? excludeRule.reason(pkg, all) : excludeRule.reason}`,
          );
          keep = false;
          break;
        }
      }
      return keep;
    })
    .sort((a, b) => -1 * compareWithUndefined(a?.gitHubStargazersCount, b?.gitHubStargazersCount));
}

export function getGitHubSlug(pkg) {
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
