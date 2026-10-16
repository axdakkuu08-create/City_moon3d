// usage: node shot.js <url> <out.png> [waitExpr] [w] [h]
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
(async () => {
  const [url, out, waitExpr, w, h] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: +(w||1000), height: +(h||700) } });
  p.on("console", m => { const t=m.text(); if(!t.includes("Fetch API")) console.log("[console]", t.slice(0,300)); });
  p.on('pageerror', e => console.log('[pageerror]', e.message.slice(0, 500)));
  await p.goto(url);
  if (waitExpr) await p.waitForFunction(waitExpr, null, { timeout: 120000 });
  await p.waitForTimeout(500);
  console.log(JSON.stringify(await p.evaluate(() => window.__measure || null), null, 1));
  await p.screenshot({ path: out });
  await b.close();
})();
