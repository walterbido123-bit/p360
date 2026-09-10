import { run, requiredEnv } from './lib.mjs';
requiredEnv(['DEPLOY_COMMAND']);
run(process.env.DEPLOY_COMMAND,'deployment adapter');
console.log('Deployment command completed successfully.');
