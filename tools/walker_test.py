from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=b.new_page(viewport={'width':800,'height':480}); logs=[]
    pg.on('pageerror',lambda e:logs.append('PAGEERROR '+str(e))); pg.on('console',lambda m:logs.append(m.text) if m.type=='error' else None)
    pg.goto('http://localhost:8123/'); pg.wait_for_function('window.__ready===true',timeout=150000)
    get='__game.walkers.map(w=>[w.c.root.position.x.toFixed(1),w.c.root.position.z.toFixed(1),w.c.currentName].join(\":\"))'
    a=pg.evaluate(get); pg.wait_for_timeout(4000); b2=pg.evaluate(get)
    print('before',a); print('after ',b2)
    pg.click('#btnBegin'); pg.wait_for_timeout(2500); pg.click('#dChoices .choice >> nth=0'); pg.wait_for_timeout(1500); pg.click('#dChoices .choice >> nth=0'); pg.wait_for_timeout(1000)
    w=pg.evaluate('(()=>{const w=__game.walkers[0];return [w.c.root.position.x,w.c.root.position.z]})()')
    pg.evaluate(f'__game.player.pos.set({w[0]}+4,0,{w[1]})'); pg.wait_for_timeout(1500); pg.screenshot(path='/tmp/claude-0/walkers.png')
    print('\n'.join(logs[:6]) or 'no errors'); b.close()
