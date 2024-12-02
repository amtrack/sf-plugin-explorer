# sf-plugin-explorer

> discover sfdx/sf plugins and their commands

https://amtrack.github.io/sf-plugin-explorer

This website indexes sf plugins based on npmjs.com and GitHub.

## Development

```
npm ci
GITHUB_TOKEN="$(gh auth token)" npm run crawl
npm run develop
```
