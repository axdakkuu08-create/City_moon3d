from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=b.new_page(viewport={'width':800,'height':480},has_touch=True)
    logs=[]; pg.on('console',lambda m:logs.append(m.type+': '+m.text) if m.type in('error',) else None); pg.on('pageerror',lambda e:logs.append('PAGEERROR '+str(e)))
    reqs=[]; pg.on('request',lambda r:reqs.append(r.url) if not r.url.startswith(('data:','blob:','file:///home/claude/game/dist/city-moon-offline.html')) else None)
    pg.goto('file:///home/claude/game/dist/city-moon-offline.html'); pg.wait_for_function('window.__ready===true',timeout=150000)
    pg.click('#btnBegin'); pg.wait_for_timeout(2500)
    print('mode',pg.evaluate('__game.mode()'),'scene',pg.evaluate('__game.state().scene'))
    pg.screenshot(path='/tmp/claude-0/f1.png')
    pg.click('#dChoices .choice >> nth=0'); pg.wait_for_timeout(2000); pg.screenshot(path='/tmp/claude-0/f2.png')
    print('external requests:',reqs[:5] or 'none'); print('\n'.join(logs[:8]) or 'no errors')
    b.close()
