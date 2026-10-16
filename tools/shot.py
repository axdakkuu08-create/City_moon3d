import sys,asyncio
from playwright.sync_api import sync_playwright
url,out=sys.argv[1],sys.argv[2]
w,h=(int(sys.argv[3]),int(sys.argv[4])) if len(sys.argv)>4 else (1000,600)
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=b.new_page(viewport={'width':w,'height':h})
    logs=[]
    pg.on('console',lambda m:logs.append(m.type+': '+m.text))
    pg.on('pageerror',lambda e:logs.append('PAGEERROR '+str(e)))
    pg.goto(url)
    try: pg.wait_for_function('window.__ready===true',timeout=90000)
    except Exception as e: logs.append('timeout waiting ready')
    pg.wait_for_timeout(2500)
    pg.screenshot(path=out)
    print('\n'.join(logs[:15]))
    b.close()
