const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 680 } });
  p.on('console', m => { const t=m.text(); if(!/GPU stall|GLDriver/.test(t)) console.log('[c:'+m.type()+']', t.slice(0,400)); });
  p.on('pageerror', e => console.log('PAGEERR', e.message.slice(0, 800), (e.stack||'').slice(0,600)));
  await p.goto('file:///home/claude/game/dist/city-moon.html');
  await p.waitForTimeout(25000);
  console.log(await p.evaluate(()=>document.getElementById('loadMsg').textContent+' | bar '+document.getElementById('loadBar').style.width));
  await p.screenshot({ path: 'dist/err.png' });
  await b.close();
})();
