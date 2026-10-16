const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 680 } });
  const errs = [];
  p.on('console', m => { const t = m.text(); if (m.type()==='error' || m.type()==='warning') errs.push(t.slice(0,300)); });
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message.slice(0, 600)));
  await p.goto('file:///home/claude/game/dist/city-moon.html');
  await p.waitForFunction('window.__ready', null, { timeout: 150000 }).catch(()=>console.log('not ready'));
  await p.waitForTimeout(800);
  await p.screenshot({ path: 'dist/t1_title.png' });
  await p.click('#beginBtn'); await p.waitForTimeout(6000);
  await p.screenshot({ path: 'dist/t2_start.png' });
  console.log('ERRORS', errs.filter(e=>!/GPU stall|ReadPixels|GLDriver/.test(e)).slice(0,10));
  console.log(await p.evaluate(()=>JSON.stringify({scene:__game.state().scene, pos:[__game.player.position.x,__game.player.position.z]})));
  await b.close();
})();
