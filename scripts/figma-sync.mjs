import fs from 'node:fs';
import { requiredEnv } from './lib.mjs';
requiredEnv(['FIGMA_TOKEN','FIGMA_FILE_KEY']);
const r=await fetch(`https://api.figma.com/v1/files/${encodeURIComponent(process.env.FIGMA_FILE_KEY)}`,{headers:{'X-Figma-Token':process.env.FIGMA_TOKEN}});
if(!r.ok) throw new Error(`Figma API ${r.status}: ${await r.text()}`);
const data=await r.json();
fs.mkdirSync('.pipeline',{recursive:true});
fs.writeFileSync('.pipeline/figma.json',JSON.stringify({name:data.name,lastModified:data.lastModified,version:data.version,document:data.document},null,2));
console.log(`Figma synced: ${data.name}`);
