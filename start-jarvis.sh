#!/usr/bin/env bash
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Install Node.js LTS from https://nodejs.org first"; exit 1; }
[ -d node_modules ] || npm install
[ -f .env ] || { cp .env.example .env; echo "Created .env — add your keys, then run again."; exit 0; }
node server.js &
sleep 3
URL=http://localhost:7777
if [ "$(uname)" = "Darwin" ]; then open -na "Google Chrome" --args --app=$URL --start-fullscreen
else (google-chrome --app=$URL --start-fullscreen || chromium-browser --app=$URL --start-fullscreen || xdg-open $URL) >/dev/null 2>&1 & fi
wait
