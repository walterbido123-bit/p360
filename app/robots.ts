import type { MetadataRoute } from 'next';

const siteUrl = () => new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://periodismo360.com');
const isProduction = (url: URL) => ['periodismo360.com', 'www.periodismo360.com'].includes(url.hostname.toLowerCase());

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: isProduction(base)
      ? { userAgent: '*', allow: '/' }
      : { userAgent: '*', disallow: '/' },
    sitemap: `${base.origin}/sitemap.xml`,
  };
}
