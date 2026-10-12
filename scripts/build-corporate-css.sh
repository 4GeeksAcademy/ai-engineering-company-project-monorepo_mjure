#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
npx --yes tailwindcss@3.4.17 --config tailwind.config.cjs --input styles/tailwind.input.css --output styles.css --minify