import sys
from playwright.sync_api import sync_playwright
themes=sys.argv[1:] or ['crimson']
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    for arg in themes:
        th,w=(arg.split(':')+['rain'])[:2]
        ctx=b.new_context(viewport={'width':800,'height':480})
        pg=ctx.new_page(); logs=[]
        pg.on('pageerror',lambda e:logs.append('PAGEERROR '+str(e))); pg.on('console',lambda m:logs.append(m.text) if m.type=='error' else None)
        pg.add_init_script("localStorage.setItem('cityMoon3dPrefs','{\"theme\":\"%s\",\"weather\":\"%s\",\"quality\":\"high\",\"sound\":true}')"%(th,w))
        pg.goto('http://localhost:8123/'); pg.wait_for_function('window.__ready===true',timeout=150000)
        pg.click('#btnBegin'); pg.wait_for_timeout(2200)
        pg.click('#dChoices .choice >> nth=0'); pg.wait_for_timeout(1500); pg.click('#dChoices .choice >> nth=0'); pg.wait_for_timeout(1500)
        pg.evaluate('__game.rig.yaw=3.14; __game.rig.pitch=.25'); pg.wait_for_timeout(1200)
        pg.screenshot(path=f'/tmp/claude-0/th_{th}_{w}.png'); print(th,'\n'.join(logs[:5]) or 'ok'); ctx.close()
    b.close()
