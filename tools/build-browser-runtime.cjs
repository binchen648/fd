const {buildSync}=require('../../binchen648_fd/work/node_modules/esbuild');
buildSync({entryPoints:['src/browser/battle-runtime.ts'],bundle:true,format:'iife',platform:'browser',target:'es2022',outfile:'ui-preview/battle-runtime.iife.js',logLevel:'warning'});
console.log('Built browser runtime');
