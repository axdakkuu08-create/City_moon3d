from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=b.new_page(viewport={'width':800,'height':480},has_touch=True)
    logs=[]; pg.on('pageerror',lambda e:logs.append('PAGEERROR '+str(e))); pg.on('console',lambda m:logs.append(m.text) if m.type=='error' else None)
    pg.goto('http://localhost:8123/'); pg.wait_for_function('window.__ready===true',timeout=150000)
    pg.click('#btnBegin'); pg.wait_for_timeout(2500)
    pg.click('#dChoices .choice >> nth=0'); pg.wait_for_timeout(1800)
    pg.click('#dChoices .choice >> nth=0'); pg.wait_for_timeout(2500)
    print('mode',pg.evaluate('__game.mode()'),'pending',pg.evaluate('__game.state().pending'))
    pg.screenshot(path='/tmp/claude-0/mini.png'); pg.click('#btnMenu'); pg.wait_for_timeout(300)
    print('\n'.join(logs[:6]) or 'no errors'); b.close()
