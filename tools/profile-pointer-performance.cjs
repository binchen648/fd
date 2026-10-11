const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('../../binchen648_fd/work/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files']});
  try {
    const page = await browser.newPage({viewport:{width:1600,height:900}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
    await page.locator('.legal-screen.is-ready').waitFor({timeout:120000});
    await page.locator('[data-legal-continue]').click();await page.waitForTimeout(1800);
    await page.locator('.press-any').click();await page.waitForTimeout(1300);
    async function sample(label) {
      const result=await page.evaluate(async()=>{
        let globalWrites=0,layerWrites=0;const observer=new MutationObserver(records=>globalWrites+=records.length);
        observer.observe(document.documentElement,{attributes:true,attributeFilter:['style']});
        const layers=new MutationObserver(records=>layerWrites+=records.length);
        document.querySelectorAll('#app .bg,#app .ambient-light').forEach(node=>layers.observe(node,{attributes:true,attributeFilter:['style']}));
        const start=performance.now();
        for(let frame=0;frame<60;frame++){
          for(let i=0;i<8;i++)document.dispatchEvent(new MouseEvent('mousemove',{clientX:200+frame*16+i,clientY:200+frame*5+i,bubbles:true}));
          await new Promise(requestAnimationFrame);
        }
        observer.disconnect();layers.disconnect();return {globalStyleMutations:globalWrites,backgroundLayerMutations:layerWrites,elapsedMs:Math.round(performance.now()-start)};
      });
      return {screen:label,...result};
    }
    const home=await sample('home');
    await page.locator('[data-nav="single"]').click();await page.waitForTimeout(750);
    await page.locator('[data-mode="free"]').click();await page.waitForTimeout(750);
    const selection=await sample('selection');
    console.log(JSON.stringify({home,selection,errors}));
    if(errors.length||home.globalStyleMutations||selection.globalStyleMutations||!home.backgroundLayerMutations||selection.backgroundLayerMutations)process.exitCode=1;
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
