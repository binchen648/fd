const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('../../binchen648_fd/work/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--allow-file-access-from-files']});try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 await page.addInitScript(()=>localStorage.setItem('fd-home-notices',JSON.stringify([{title:'保留公告文字',image:'../assets/map/locations/workshop.png'},{title:'自定义图片',image:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'},{title:'旧网络公告',image:'https://anime.fate-go.jp/ep6-movie/wandering/assets/img/special/digicon/pc_03.jpg'}])));
 await page.route(/^https?:\/\//,route=>route.abort());
 const click=async s=>{await page.locator(s).click();await page.waitForTimeout(850)};
 await page.goto(pathToFileURL(path.resolve('ui-preview/本地UI预览.html')).href);await page.locator('.legal-screen.is-ready').waitFor({timeout:120000});await click('[data-legal-continue]');await page.waitForTimeout(1200);await click('.press-any');
 const old=page.locator('[data-notice-slide="0"]');assert.equal(await old.locator('h2').innerText(),'保留公告文字');assert.match(await old.locator('img').getAttribute('src'),/^\.\.\/assets\/ui\/display-art\//);
 assert.match(await page.locator('[data-notice-slide="2"] img').getAttribute('src'),/^\.\.\/assets\/ui\/display-art\//);
 assert.match(await page.locator('[data-notice-slide="1"] img').getAttribute('src'),/^data:image\/gif/);
 await old.locator('img').evaluate(async e=>{await e.decode();if(e.naturalWidth<1000)throw Error('announcement art is too small')});
 await click('[data-nav="tutorial"]');await page.mouse.move(0,0);
 assert.equal(await page.locator('.tutorial-hub-art').count(),2);
 for(const img of await page.locator('.tutorial-hub-art').all()){assert.match(await img.getAttribute('src'),/^\.\.\/assets\/ui\/display-art\//);await img.evaluate(async e=>{await e.decode();if(e.naturalWidth<1000)throw Error('tutorial art is too small')})}
 await page.screenshot({path:path.resolve('ui-preview/design-review/tutorial/directory-web-art-1280.png')});
 console.log('Passed: downloaded images decode with network blocked, old local/network notice art migrates, custom uploads and notice text remain intact.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
