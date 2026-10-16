#!/bin/bash
# usage: tools/checkpoint.sh <tag>   -> /home/claude/releases/city-moon-3d-<tag>.zip (source+assets+PLAN, no node_modules)
cd /home/claude && mkdir -p releases && rm -f releases/city-moon-3d-$1.zip
zip -qr releases/city-moon-3d-$1.zip game -x "game/node_modules/*" -x "game/package*.json" -x "game/*.png" -x "game/dist/debug*" -x "game/dist/game.bundle.js" -x "game/dist/city-moon.html" -x "game/dist/assets.js"
cp releases/city-moon-3d-$1.zip city-moon-3d-latest.zip; ls -la releases | tail -3
