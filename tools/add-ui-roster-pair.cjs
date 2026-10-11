const fs=require('fs'),vm=require('vm'),path=require('path');
const legacy=JSON.parse(fs.readFileSync('src/content/generated/legacy-content.json','utf8'));
const ctx={window:{}};for(const f of ['codex-detail-data.js','character-preview-data.js'])vm.runInNewContext(fs.readFileSync('ui-preview/'+f,'utf8'),ctx);
function imageIfExists(p){return fs.existsSync(path.resolve('ui-preview',p))?p:''}
for(const [bucket,id] of [['masters','master.rin'],['servants','servant.emiya']]){
 const entity=legacy[bucket].find(x=>x.id===id);if(!entity)throw Error(id);
 const kind=bucket==='masters'?'master':'servant';
 const skills=entity.skills.filter(x=>!x.tags?.includes('ascension')).map(x=>({id:x.id,name:x.name,type:x.typeLabel,text:x.text,cost:x.cost,basePower:x.basePower,requirement:x.requirement,image:imageIfExists('../assets/cards/skills/'+kind+'-'+entity.name+'-'+x.legacyId+'.png')}));
 const detail={sourceId:id,name:entity.name,fullName:entity.name,class:entity.class||'Master',image:'../assets/cards/'+bucket+'/'+entity.name+'.png',skills};
 if(entity.deck){const groups=new Map();for(const id of entity.deck){if(groups.has(id)){groups.get(id).count++;continue}const c=legacy.cards.find(c=>c.id===id);if(!c)throw Error(id);groups.set(id,{id,name:c.name,type:c.typeLabel,text:c.text,cost:c.cost,basePower:c.basePower,image:imageIfExists('../assets/cards/deck/'+c.legacyId+'.png'),count:1})}detail.deck=[...groups.values()]}
 ctx.window.FDCodexDetailData[bucket][entity.name]=detail;
 ctx.window.FDCharacterPreviewData[bucket][entity.name]={...detail,skills:skills.map(({id,name,type,text})=>({id,name,type,text}))};delete ctx.window.FDCharacterPreviewData[bucket][entity.name].deck;
}
for(const [f,key] of [['codex-detail-data.js','FDCodexDetailData'],['character-preview-data.js','FDCharacterPreviewData']])fs.writeFileSync('ui-preview/'+f,'window.'+key+'='+JSON.stringify(ctx.window[key],null,2)+';\n');
let s=fs.readFileSync('ui-preview/本地UI预览.html','utf8');
s=s.replace("'奥尔加玛丽·阿尼姆斯菲亚'];","'奥尔加玛丽·阿尼姆斯菲亚','远坂凛'];");
s=s.replace("['坂田金时','Berserker']];","['坂田金时','Berserker'],['卫宫','Archer']];");
s=s.replace("'奥尔加玛丽·阿尼姆斯菲亚':4};","'奥尔加玛丽·阿尼姆斯菲亚':4,'远坂凛':3};");
s=s.replace('从未被禁用的 3 名候选御主中选择 1 名。',"从未被禁用的 '+threeXMasterCandidates.length+' 名候选御主中选择 1 名。");
fs.writeFileSync('ui-preview/本地UI预览.html',s);console.log('Added 远坂凛 / Archer 卫宫 from local printed content');
