# sf-plugin-explorer

> discover sfdx/sf plugins and their commands

https://amtrack.github.io/sf-plugin-explorer

This website indexes sf plugins based on npmjs.com and GitHub.

![screenshot](https://repository-images.githubusercontent.com/551899822/29b14cf9-6401-44c3-b4d7-276dfad22ad5)

## Development

```
npm ci
GITHUB_TOKEN="$(gh auth token)" npm run crawl
npm run develop
```
