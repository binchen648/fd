const fs=require('node:fs'),path=require('node:path');
const directory=path.resolve(__dirname,'../assets/ui/display-art');
const wallpaperSource='https://anime.fate-go.jp/ep6-movie/wandering/special/digicon/';
const entries=[
 {category:'已使用壁纸',label:'所罗门',file:'fgo-solomon.jpg',source:'https://anime.fate-go.jp/ep7-tv/special/wallpaper2/'},
 {category:'已使用壁纸',label:'卡美洛 · 圆桌',file:'fgo-camelot-knights.jpg',source:wallpaperSource},
 {category:'已使用壁纸',label:'卡美洛 · 旅途',file:'fgo-camelot-journey.jpg',source:wallpaperSource},
 {category:'已使用壁纸',label:'卡美洛 · 阵营',file:'fgo-camelot-battle.jpg',source:wallpaperSource},
 ...JSON.parse(fs.readFileSync(path.join(directory,'library.json'),'utf8').replace(/^\uFEFF/,''))
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const entry of entries)if(!fs.statSync(path.join(directory,entry.file)).isFile())throw Error('Missing image '+entry.file);
const sections=[...new Set(entries.map(e=>e.category))].map(category=>'<section><h2>'+esc(category)+'</h2><div class="grid">'+entries.filter(e=>e.category===category).map(e=>'<article><a href="'+esc(e.file)+'" target="_blank"><img src="'+esc(e.file)+'" alt="'+esc(e.label)+'" onload="this.closest(\'article\').querySelector(\'.dimensions\').textContent=this.naturalWidth+\' × \'+this.naturalHeight"></a><div class="copy"><h3>'+esc(e.label)+'</h3><span class="dimensions"></span><p>'+esc(e.file)+'</p><a href="'+esc(e.source)+'" target="_blank" rel="noopener">查看来源 ↗</a></div></article>').join('')+'</div></section>').join('');
fs.writeFileSync(path.join(directory,'index.html'),'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fate / FGO 本地图片库</title><style>*{box-sizing:border-box}body{margin:0;padding:32px;background:#171b1e;color:#eeeae0;font:15px/1.6 "Microsoft YaHei",sans-serif}header{max-width:1500px;margin:auto;border-bottom:1px solid #ffffff25;padding-bottom:20px}header small{color:#edc46c;letter-spacing:.16em}h1{margin:8px 0;font-size:32px}header p{color:#abb6bd;margin:0}section{max-width:1500px;margin:32px auto}h2{font-size:20px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px}article{background:#252a2e;overflow:hidden;border:1px solid #ffffff15}article>a{display:block;background:#11161a}img{display:block;width:100%;height:190px;object-fit:contain}.copy{padding:16px}h3{margin:0 0 4px;font-size:17px}.dimensions{color:#c5b17f;font-size:12px}p{overflow-wrap:anywhere;font-size:12px;color:#a9b3ba}a{color:#edc46c;text-decoration:none}a:hover{text-decoration:underline}@media(max-width:700px){body{padding:16px}}</style><header><small>LOCAL ASSET LIBRARY</small><h1>Fate / FGO 本地图片库</h1><p>共 '+entries.length+' 张 · 点击缩略图查看原图 · 来源记录随素材保存</p></header>'+sections+'</html>');
console.log('Built local picture directory with '+entries.length+' images.');
