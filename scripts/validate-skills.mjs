import fs from 'node:fs';
import path from 'node:path';
const base='skills/web-development';
const dirs=fs.readdirSync(base,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name).sort();
const errors=[];
for(const d of dirs){
  const p=path.join(base,d,'SKILL.md');
  if(!fs.existsSync(p)) errors.push(`${d}: missing SKILL.md`);
  else {
    const s=fs.readFileSync(p,'utf8');
    for(const marker of ['name:','## Propósito','## Definition of Done']) if(!s.includes(marker)) errors.push(`${d}: missing ${marker}`);
  }
}
if(dirs.length!==23) errors.push(`expected 23 skill directories, found ${dirs.length}`);
if(errors.length){ console.error(errors.join('\n')); process.exit(1); }
console.log(`OK: ${dirs.length} skills validated.`);
