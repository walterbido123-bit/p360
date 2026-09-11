const base=(process.env.E2E_BASE_URL||'').replace(/\/$/,'');
if(!base) throw new Error('E2E_BASE_URL is required');
const checks=['/','/robots.txt','/sitemap.xml'];
for(const path of checks){
 const r=await fetch(`${base}${path}`,{redirect:'follow'});
 if(!r.ok) throw new Error(`${path} returned HTTP ${r.status}`);
 const body=await r.text();
 if(!body.trim()) throw new Error(`${path} returned an empty body`);
 console.log(`[ok] ${path} ${r.status} ${r.headers.get('content-type')||''}`);
}
const home=await (await fetch(`${base}/`)).text();
if(!/PERIODISMO/i.test(home)) throw new Error('Homepage does not contain Periodismo360 brand marker');
console.log('E2E staging smoke test passed.');
