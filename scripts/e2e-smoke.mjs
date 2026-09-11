const rawBase = process.env.E2E_BASE_URL || '';
const allowedHost = (process.env.E2E_ALLOWED_HOST || '').toLowerCase();

if (!rawBase) throw new Error('E2E_BASE_URL is required');
if (!allowedHost) throw new Error('E2E_ALLOWED_HOST is required');

const baseUrl = new URL(rawBase);
const productionHosts = new Set(['periodismo360.com', 'www.periodismo360.com']);
if (baseUrl.protocol !== 'https:') throw new Error('Staging URL must use HTTPS');
if (productionHosts.has(baseUrl.hostname.toLowerCase())) throw new Error('Refusing to test the production hostname');
if (baseUrl.hostname.toLowerCase() !== allowedHost) {
  throw new Error(`Staging hostname ${baseUrl.hostname} does not match E2E_ALLOWED_HOST`);
}
baseUrl.pathname = baseUrl.pathname.replace(/\/$/, '');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(path, expectedType, attempts = 5) {
  const url = new URL(`${baseUrl.pathname}${path}`, baseUrl.origin);
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(10_000),
        headers: { Accept: expectedType },
      });
      const finalUrl = new URL(response.url);
      if (finalUrl.origin !== baseUrl.origin) {
        throw new Error(`${path} redirected outside staging to ${finalUrl.origin}`);
      }
      if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes(expectedType)) {
        throw new Error(`${path} returned ${contentType || 'no content type'}; expected ${expectedType}`);
      }
      const body = await response.text();
      if (!body.trim()) throw new Error(`${path} returned an empty body`);
      console.log(`[ok] ${path} ${response.status} ${contentType}`);
      return body;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(attempt * 2_000);
    }
  }
  throw lastError;
}

const home = await request('/', 'text/html');
if (!/PERIODISMO360/i.test(home)) throw new Error('Homepage does not contain the Periodismo360 brand marker');
if (/Application error|Internal Server Error|__next_error__/i.test(home)) throw new Error('Homepage contains an application error marker');

const robots = await request('/robots.txt', 'text/plain');
if (!/User-agent:\s*\*/i.test(robots) || !/Disallow:\s*\//i.test(robots)) {
  throw new Error('Staging robots.txt must disallow all crawlers');
}
if (!robots.includes(`${baseUrl.origin}/sitemap.xml`)) {
  throw new Error('robots.txt does not reference the staging sitemap');
}
if (/https?:\/\/(www\.)?periodismo360\.com/i.test(robots)) {
  throw new Error('robots.txt contains a production URL');
}

const sitemap = await request('/sitemap.xml', 'application/xml');
if (!/<urlset[\s>]/i.test(sitemap) || !/<loc>/i.test(sitemap)) throw new Error('sitemap.xml is not a populated sitemap');
if (/https?:\/\/(www\.)?periodismo360\.com/i.test(sitemap)) throw new Error('sitemap.xml contains a production URL');
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/gi)].map((match) => match[1].trim());
if (locations.some((location) => new URL(location).origin !== baseUrl.origin)) {
  throw new Error('sitemap.xml contains a URL outside staging');
}

const wpBase = new URL(process.env.WORDPRESS_READ_URL || '');
if (wpBase.protocol !== 'https:' || wpBase.hostname !== 'periodismo360.com') {
  throw new Error('WORDPRESS_READ_URL must be the approved read-only production origin');
}
const wpResponse = await fetch(new URL('/index.php?rest_route=%2Fwp%2Fv2%2Fposts&per_page=1&_fields=id%2Cslug', wpBase), {
  method: 'GET',
  redirect: 'error',
  signal: AbortSignal.timeout(10_000),
  headers: { Accept: 'application/json' },
});
if (!wpResponse.ok) throw new Error(`WordPress read API returned HTTP ${wpResponse.status}`);
if (!(wpResponse.headers.get('content-type') || '').toLowerCase().includes('application/json')) {
  throw new Error('WordPress read API did not return JSON');
}
const posts = await wpResponse.json();
if (!Array.isArray(posts) || posts.length === 0 || !posts[0]?.id) {
  throw new Error('WordPress read API returned no verifiable post');
}
console.log('[ok] WordPress public REST API GET boundary');
console.log('E2E staging smoke test passed.');
