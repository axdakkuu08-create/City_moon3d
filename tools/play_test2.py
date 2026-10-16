import sys
from playwright.sync_api import sync_playwright
out='/tmp/claude-0/'
W,H=(int(sys.argv[1]),int(sys.argv[2])) if len(sys.argv)>2 else (1000,600)
tag=sys.argv[3] if len(sys.argv)>3 else 'a'
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    ctx=b.new_context(viewport={'width':W,'height':H},has_touch=(W<H or H<500))
    pg=ctx.new_page()
    logs=[]
    pg.on('console',lambda m:logs.append(m.type+': '+m.text) if m.type in('error','warning') and 'GL Driver' not in m.text else None)
    pg.on('pageerror',lambda e:logs.append('PAGEERROR '+str(e)))
    pg.goto('http://localhost:8123/'); pg.wait_for_function('window.__ready===true',timeout=120000)
    pg.click('#btnBegin'); pg.wait_for_timeout(2500)
    pg.screenshot(path=out+f'p_{tag}1_dialog.png')
    pg.click('#dChoices .choice >> nth=0'); pg.wait_for_timeout(1800)   # -> miraDoor (street)
    pg.screenshot(path=out+f'p_{tag}2_mira.png')
    pg.click('#dChoices .choice >> nth=0'); pg.wait_for_timeout(1500)   # -> libraryIntro pending (travel)
    print('mode',pg.evaluate('__game.mode()'),'pending',pg.evaluate('__game.state().pending'),'objective visible',pg.evaluate("!document.getElementById('objective').classList.contains('hidden')"))
    pg.wait_for_timeout(800); pg.screenshot(path=out+f'p_{tag}3_travel.png')
    # walk with keyboard a bit
    x0=pg.evaluate('[__game.player.pos.x,__game.player.pos.z]')
    pg.keyboard.down('KeyW'); pg.wait_for_timeout(1500); pg.keyboard.down('Shift'); pg.wait_for_timeout(1200)
    pg.screenshot(path=out+f'p_{tag}4_run.png'); pg.keyboard.press('Space'); pg.wait_for_timeout(300); pg.screenshot(path=out+f'p_{tag}5_jump.png')
    pg.keyboard.up('KeyW'); pg.keyboard.up('Shift')
    print('moved',[round(v,1) for v in x0],'->',[round(v,1) for v in pg.evaluate('[__game.player.pos.x,__game.player.pos.z]')],'anim',pg.evaluate('__game.player.currentName'))
    # teleport to library marker
    L=pg.evaluate('__game.LOCATIONS.library.marker')
    pg.evaluate(f'__game.player.pos.set({L[0]},0,{L[1]}+5)'); pg.wait_for_timeout(500)
    pg.evaluate(f'__game.player.pos.set({L[0]},0,{L[1]})'); pg.wait_for_timeout(2500)
    print('at library: mode',pg.evaluate('__game.mode()'),'scene',pg.evaluate('__game.state().scene'))
    pg.screenshot(path=out+f'p_{tag}6_library.png')
    # orb pickup test
    pg.click('#dChoices .choice >> nth=1'); pg.wait_for_timeout(1500)
    o=pg.evaluate('(()=>{const o=__game.orbs[0];return [o.position.x,o.position.z]})()')
    pg.evaluate(f'__game.player.pos.set({o[0]},0,{o[1]})'); pg.wait_for_timeout(800)
    print('orbs collected',pg.evaluate('__game.state().orbs.length'),'mode',pg.evaluate('__game.mode()'))
    print('\n'.join(logs[:12]) or 'no console errors')
    b.close()
