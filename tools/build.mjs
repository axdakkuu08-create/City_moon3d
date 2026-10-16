import fs from 'node:fs'; import { execSync } from 'node:child_process';
const D = '/home/claude/game'; 
execSync(`/root/.bun/bin/bun build ${D}/src/main.js --outfile ${D}/dist/game.bundle.js --target browser --minify`, { stdio: 'inherit' });
const tpl = fs.readFileSync(`${D}/src/template.html`, 'utf8');
const safe = s => s.replace(/<\/script/gi, '<\\/script');
const assets = fs.readFileSync(`${D}/dist/assets.js`, 'utf8'); const game = fs.readFileSync(`${D}/dist/game.bundle.js`, 'utf8');
// game is an ES module (top-level await) -> inline as type=module
let out = tpl.replace('<script>/*ASSETS*/</script>', () => '<script>' + safe(assets) + '</script>').replace('<script>/*GAME*/</script>', () => '<script type="module">' + safe(game) + '</script>');
fs.writeFileSync(`${D}/dist/city-moon.html`, out); console.log('built', (out.length / 1e6).toFixed(2), 'MB');
