#!/usr/bin/env bash
# Rebuilds everything made from the screenshots: demo images, social images,
# the two videos, and the copy of the 16:9 video the demo page plays.
# Run from the repo root after capture-web.js / the Android capture.
set -euo pipefail
cd "$(dirname "$0")/.."
export NODE_PATH="${NODE_PATH:-$(cd ../.. && pwd)/mediq-web/node_modules}"  # Playwright

# demo/img: smaller JPEG copies of the screenshots (web 1600px wide, phones 780/720px)
rm -rf demo/img && mkdir -p demo/img
for f in screenshots/web/*.png; do
  b=$(basename "$f" .png); w=1600; [[ $b == *patient* ]] && w=780
  ffmpeg -loglevel error -y -i "$f" -vf "scale=$w:-2" -q:v 3 "demo/img/web-$b.jpg"
done
for f in screenshots/mobile/*.png; do
  b=$(basename "$f" .png)
  ffmpeg -loglevel error -y -i "$f" -vf "scale=720:-2" -q:v 3 "demo/img/app-$b.jpg"
done

node social/render.js
node video/render.js
mkdir -p demo/media && cp video/mediq-demo-16x9.mp4 demo/media/
