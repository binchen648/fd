const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('../../binchen648_fd/work/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.route(/^https?:\/\//,route=>route.abort());
 await page.goto(pathToFileURL(path.resolve('assets/ui/display-art/index.html')).href);
 const images=page.locator('article img');assert.equal(await images.count(),16);
 const sizes=[];for(const img of await images.all())sizes.push(await img.evaluate(async e=>{await e.decode();return {name:e.alt,width:e.naturalWidth,height:e.naturalHeight}}));
 assert.ok(sizes.every(s=>s.width>=500&&s.height>=500));
 assert.ok(sizes.filter(s=>['冬木','奥尔良','罗马','俄刻阿诺斯','伦敦','北美','卡美洛','巴比伦尼亚','新宿'].includes(s.name)).every(s=>s.width>=1920));
 await page.screenshot({path:path.resolve('.tmp-local-art-library.png'),fullPage:true});console.log(JSON.stringify({passed:true,count:sizes.length,sizes},null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
