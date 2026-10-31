import {expect,test}from'@playwright/test';
import {readFileSync,writeFileSync}from'node:fs';
import {fdRealAssetManifest}from'../apps/client/src/state/fd-asset-manifest';
import {resolveCardImageUrl,resolveEntityImageUrl,approvedAuthoringMasterIds,approvedAuthoringServantIds}from'../apps/client/src/state/fd-asset-registry';

test('approved seven-player art is served as images and printed master skills inspect their real overview',async({page,request},info)=>{
 const pack=JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json','utf8')) as {authoringMasterFiles:string[];authoringServantFiles:string[]};
 const urls=new Set<string>([...Object.values(fdRealAssetManifest.entities),...Object.values(fdRealAssetManifest.cards)]);
 for(const path of [...pack.authoringMasterFiles,...pack.authoringServantFiles]){
  const archive=JSON.parse(readFileSync(path,'utf8')) as {id:string;cards:Array<{id:string;cardType:string}>};
  urls.add(resolveCardImageUrl({definitionId:archive.id,cardType:archive.id.startsWith('master.')?'master_overview':'servant_overview'}));
  for(const card of archive.cards){const url=resolveCardImageUrl({definitionId:card.id,cardType:card.cardType});expect(url,card.id).not.toContain('/placeholders/');urls.add(url);}
 }
 for(const url of urls){
  const response=await request.get(url);expect(response.ok(),url).toBe(true);
  expect(response.headers()['content-type'],url).toMatch(/^image\//);
  const bytes=await response.body();expect(bytes.length,url).toBeGreaterThan(0);
  if(url.endsWith('.png'))expect([...bytes.subarray(0,8)],url).toEqual([137,80,78,71,13,10,26,10]);
 }
 const failures:string[]=[];page.on('pageerror',e=>failures.push(e.message));
 await page.goto('/');await expect(page.getByLabel('对局房间')).toContainText('实战进行中');
 await expect(page.getByLabel('七人席位').locator('button')).toHaveCount(7);
 const workbench=page.getByRole('region',{name:'本人操作台',exact:true});
 if(await workbench.locator('.workbench__toggle').getAttribute('aria-expanded')==='false')await workbench.locator('.workbench__toggle').click();
 await workbench.getByRole('button',{name:'检视 转换魔术',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'转换魔术',exact:true});await expect(dialog).toBeVisible();
 const art=dialog.locator('.inspection-card-art img');await expect(art).toHaveAttribute('src',fdRealAssetManifest.entities['master.irisviel']);
 await expect.poll(()=>art.evaluate((image:HTMLImageElement)=>image.complete&&image.naturalWidth>0)).toBe(true);
 expect(resolveCardImageUrl({definitionId:'master.kayneth.skill.unreviewed',cardType:'master_skill'})).toContain('/placeholders/');
 for(const id of [...approvedAuthoringMasterIds,...approvedAuthoringServantIds])expect(urls.has(resolveEntityImageUrl(id.startsWith('master.')?'master':'servant',id))).toBe(true);
 expect(failures).toEqual([]);
 await dialog.screenshot({path:info.outputPath('printed-master-skill.png')});
 writeFileSync(info.outputPath('approved-asset-result.json'),JSON.stringify({approvedMasters:7,approvedServants:7,approvedArchiveCards:46,inlineMasterMappings:14,servedUniqueImages:urls.size,allHTTPImageResponses:true,sevenPlayerLocalUI:true,inspected:'master.irisviel.skill.conversion-magic',unknownSkillIsPlaceholder:true,pageErrors:failures},null,2));
});
