#!/usr/bin/env bash

set -eo pipefail

cp node_modules/@salesforce-ux/design-system/assets/styles/salesforce-lightning-design-system.min.css site/vendor/
cp node_modules/@salesforce-ux/design-system/assets/icons/utility-sprite/svg/symbols.svg site/vendor/
cp node_modules/gridjs/dist/gridjs.module.js site/vendor/