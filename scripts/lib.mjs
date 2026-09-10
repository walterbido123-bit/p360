import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export const root = process.cwd();
export const readJson = p => JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
export const exists = p => fs.existsSync(path.join(root,p));
export function run(command, label=command) {
  if (!command || command.startsWith('${')) { console.log(`[skip] ${label}: not configured`); return; }
  console.log(`[run] ${label}: ${command}`);
  execSync(command,{stdio:'inherit',cwd:root,env:process.env});
}
export function requiredEnv(names) {
  const missing=names.filter(n=>!process.env[n]);
  if(missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}
