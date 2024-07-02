#!/usr/bin/env bash

set -eo pipefail

./scripts/get-packages.js
./scripts/get-package-dependencies.js
./scripts/get-repos.js
./scripts/get-commands.js
