const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const W=+process.argv[2]||900,H=+process.argv[3]||520;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message.slice(0, 600)));
  await p.goto('file:///home/claude/game/dist/city-moon.html');
  await p.waitForFunction('window.__ready', null, { timeout: 150000 });
  await p.click('#beginBtn');
  await p.waitForFunction("!document.getElementById('dialogue').classList.contains('hidden')", null, { timeout: 120000 });
  await p.evaluate(()=>{document.getElementById('dialogue').classList.add('hidden');document.body.classList.remove('dlg');});
  const shots = [
    ['home', null, 0, 0.25],
    ['street', 'street', 0.6, 0.3],
    ['library', 'library', 0.0, 0.22],
    ['station', 'station', 0.3, 0.3],
    ['tower', 'tower', 3.14, 0.18],
  ];
  for (const [name, zone, yaw, pitch] of shots) {
    await p.evaluate(([zone,yaw,pitch])=>{ const g=__game; if(zone){const z=g.ZONES[zone].pos; g.teleport(z.x+0, z.z+2.5);} g.setYaw(yaw); g.setPitch(pitch); }, [zone,yaw,pitch]);
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `dist/tour_${name}.png` });
  }
  console.log('ERRORS', errs);
  await b.close();
})();
