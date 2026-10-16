const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 420, height: 260 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 500)));
  await p.goto('file:///home/claude/game/dist/city-moon.html');
  await p.waitForFunction('window.__ready', null, { timeout: 150000 });
  const plans = (process.argv[2] || 'first,last,rand1,rand2,rand3,rand4').split(',');
  const endings = {};
  for (const plan of plans) {
    await p.evaluate(() => __game.startGame(true));
    let seed = plan.startsWith('rand') ? +plan.slice(4) * 7919 : 0; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const path = []; let ending = null;
    for (let step = 0; step < 40 && !ending; step++) {
      const open = await p.evaluate(() => !document.getElementById('dialogue').classList.contains('hidden') && document.body.classList.contains('dlg'));
      if (!open) {
        await p.evaluate(() => { const g = __game; const sc = g.state().scene; const zmap = window.__zoneOf; const z = g.ZONES; const order = { opening:'home' }; });
        // teleport to the current objective zone (read from HUD text via state scene mapping exposed on window)
        await p.evaluate(() => { const g = __game; const name = window.__sceneZone ? window.__sceneZone[g.state().scene] : null; if (name) { const z = g.ZONES[name].pos; g.teleport(z.x, z.z + 0.5); } });
        await p.waitForFunction("document.body.classList.contains('dlg')", null, { timeout: 60000 }).catch(() => {});
        await p.waitForTimeout(300);
      }
      const info = await p.evaluate(() => ({ scene: __game.state().scene, n: document.getElementById('dlgChoices').children.length, labels: [...document.getElementById('dlgChoices').children].map(c => c.textContent) }));
      path.push(info.scene);
      if (/^ending/.test(info.scene)) { ending = info.scene; break; }
      let idx = plan === 'first' ? 0 : plan === 'last' ? info.n - 1 : Math.floor(rnd() * info.n);
      await p.evaluate(i => document.getElementById('dlgChoices').children[i].click(), idx);
      await p.waitForTimeout(500);
    }
    const st = await p.evaluate(() => { const s = __game.state(); return { trust: s.trust, comp: s.compassion, clues: s.clues.length }; });
    endings[plan] = { ending, ...st, path: path.join('>') };
    console.log(plan, JSON.stringify(endings[plan]));
  }
  console.log('ERR', errs); await b.close();
})();
