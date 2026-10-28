import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
await build({entryPoints:['client/blob-upload.js'],bundle:true,minify:true,format:'esm',platform:'browser',outfile:'public/assets/blob-upload.js'});
const result=spawnSync(process.execPath,['node_modules/next/dist/bin/next','build','--webpack'],{stdio:'inherit'});
if(result.error)throw result.error;
process.exit(result.status??1);
