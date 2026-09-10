import fs from 'node:fs';
import { run } from './lib.mjs';
const checks=[
 ['QA_LINT_COMMAND','lint'],['QA_TEST_COMMAND','tests'],['QA_TYPECHECK_COMMAND','typecheck'],
 ['QA_A11Y_COMMAND','accessibility'],['QA_SEO_COMMAND','SEO'],['QA_PERF_COMMAND','performance'],['QA_SECURITY_COMMAND','security']
];
const results=[];
for(const [key,label] of checks){
 const cmd=process.env[key];
 if(!cmd){ results.push({label,status:'not-configured'}); continue; }
 try{ run(cmd,label); results.push({label,status:'passed'}); }
 catch(e){ results.push({label,status:'failed'}); fs.mkdirSync('.pipeline',{recursive:true}); fs.writeFileSync('.pipeline/qa.json',JSON.stringify(results,null,2)); throw e; }
}
fs.mkdirSync('.pipeline',{recursive:true}); fs.writeFileSync('.pipeline/qa.json',JSON.stringify(results,null,2));
console.log('QA gate passed for all configured checks.');
