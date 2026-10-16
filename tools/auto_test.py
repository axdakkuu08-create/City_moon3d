from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=b.new_page(viewport={'width':800,'height':480}); logs=[]
    pg.on('pageerror',lambda e:logs.append('PAGEERROR '+str(e))); pg.on('console',lambda m:logs.append(m.text) if m.type=='error' else None)
    pg.add_init_script("localStorage.setItem('cityMoon3dPrefs','{\"theme\":\"auto\",\"weather\":\"clear\",\"quality\":\"high\",\"sound\":true}')")
    pg.goto('http://localhost:8123/'); pg.wait_for_function('window.__ready===true',timeout=150000)
    g="(()=>{const c=__game.sky.cur;return {top:c.domeTop.getHexString(),hor:c.domeHor.getHexString(),win:+c.win.toFixed(2)}})()"
    print('title   ',pg.evaluate(g))
    pg.click('#btnBegin'); pg.wait_for_timeout(2500)
    pg.evaluate("__game.openScene('endingRestore')"); pg.wait_for_timeout(9000)
    print('restore ',pg.evaluate(g),' (dawn target hor ffd9bd, win 0)')
    pg.screenshot(path='/tmp/claude-0/auto_end.png')
    print('\n'.join(logs[:6]) or 'no errors'); b.close()
