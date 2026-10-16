import sys
from playwright.sync_api import sync_playwright
out='/tmp/claude-0/'
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=b.new_page(viewport={'width':1000,'height':600})
    logs=[]
    pg.on('console',lambda m:logs.append(m.type+': '+m.text) if m.type in('error','warning') and 'GL Driver' not in m.text else None)
    pg.on('pageerror',lambda e:logs.append('PAGEERROR '+str(e)))
    pg.goto('http://localhost:8123/')
    pg.wait_for_function('window.__ready===true',timeout=120000)
    pg.wait_for_timeout(1500); pg.screenshot(path=out+'t1_title.png')
    pg.click('#btnBegin'); pg.wait_for_timeout(2500); pg.screenshot(path=out+'t2_dialog.png')
    print('mode',pg.evaluate('__game.mode()'),'scene',pg.evaluate('__game.state().scene'))
    pg.click('#dChoices .choice >> nth=0'); pg.wait_for_timeout(2500)
    print('after choice mode',pg.evaluate('__game.mode()'),'scene',pg.evaluate('__game.state().scene'))
    pg.screenshot(path=out+'t3_after.png')
    # walk forward with keyboard
    x0=pg.evaluate('[__game.player.pos.x,__game.player.pos.z]')
    pg.keyboard.down('KeyW'); pg.wait_for_timeout(1800); pg.keyboard.down('Shift'); pg.wait_for_timeout(1200)
    pg.screenshot(path=out+'t4_walk.png')
    pg.keyboard.press('Space'); pg.wait_for_timeout(350); pg.screenshot(path=out+'t5_jump.png')
    pg.keyboard.up('KeyW'); pg.keyboard.up('Shift')
    x1=pg.evaluate('[__game.player.pos.x,__game.player.pos.z]')
    print('moved',x0,'->',x1,'anim',pg.evaluate('__game.player.currentName'))
    print('\n'.join(logs[:12]) or 'no console errors')
    b.close()
