// usage: node free.js name px py pz lx ly lz [name2 ...]
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
(async () => {
  const args = process.argv.slice(2); const shots = []; while (args.length) shots.push([args.shift(), ...args.splice(0, 6).map(Number)]);
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 900, height: 520 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 500)));
  await p.goto('file:///home/claude/game/dist/city-moon.html');
  await p.waitForFunction('window.__ready', null, { timeout: 150000 });
  await p.click('#beginBtn');
  await p.waitForFunction("!document.getElementById('dialogue').classList.contains('hidden')", null, { timeout: 120000 });
  await p.evaluate(()=>{document.getElementById('dialogue').classList.add('hidden');document.body.classList.remove('dlg');document.getElementById('hud').style.display='none';});
  for (const [n, px, py, pz, lx, ly, lz] of shots) {
    await p.evaluate(([px,py,pz,lx,ly,lz])=>{ window.__freeCam={pos:[px,py,pz],look:[lx,ly,lz]}; }, [px,py,pz,lx,ly,lz]);
    await p.waitForTimeout(1800); await p.screenshot({ path: `dist/free_${n}.png` });
  }
  console.log('ERR', errs); await b.close();
})();
