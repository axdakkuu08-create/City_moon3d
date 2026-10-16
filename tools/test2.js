const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const W=+process.argv[2]||760,H=+process.argv[3]||460;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message.slice(0, 600)));
  p.on('console', m => { if (m.type()==='error') errs.push(m.text().slice(0,300)); });
  await p.goto('file:///home/claude/game/dist/city-moon.html');
  await p.waitForFunction('window.__ready', null, { timeout: 150000 });
  await p.click('#beginBtn');
  await p.waitForFunction("document.getElementById('dialogue') && !document.getElementById('dialogue').classList.contains('hidden')", null, { timeout: 120000 });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: 'dist/t3_dialogue.png' });
  // pick first choice, then walk
  await p.click('.choice'); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'dist/t4_after.png' });
  console.log('state', await p.evaluate(()=>JSON.stringify(__game.state().scene)));
  console.log('ERRORS', errs);
  await b.close();
})();
