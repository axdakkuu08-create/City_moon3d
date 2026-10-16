from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    import sys
    pg=b.new_page(viewport={'width':800,'height':480})
    if len(sys.argv)>1: pg.add_init_script("localStorage.setItem('cityMoon3dPrefs','{\"quality\":\"%s\",\"sound\":true}')"%sys.argv[1])
    logs=[]; pg.on('pageerror',lambda e:logs.append('PAGEERROR '+str(e))); pg.on('console',lambda m:logs.append(m.text) if m.type=='error' else None)
    pg.goto('http://localhost:8123/'); pg.wait_for_function('window.__ready===true',timeout=150000)
    pg.click('#btnBegin'); pg.wait_for_timeout(3000)
    i=pg.evaluate('(()=>{const r=__game.renderer.info;return {calls:r.render.calls,tris:r.render.triangles,geoms:r.memory.geometries,progs:r.programs.length}})()')
    print('RENDER INFO',i); print('\n'.join(logs[:6]) or 'no errors')
    pg.screenshot(path='/tmp/claude-0/perf.png'); b.close()
