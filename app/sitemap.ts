import type { MetadataRoute } from 'next';
import { categories,categorySlug } from '@/lib/content';
import { getSitemapStories } from '@/lib/wordpress';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const base=process.env.NEXT_PUBLIC_SITE_URL||'https://periodismo360.com';const stories=await getSitemapStories(50);return [{url:base,lastModified:new Date(),changeFrequency:'hourly',priority:1},...categories.map(c=>({url:`${base}/categoria/${categorySlug(c)}`,lastModified:new Date(),changeFrequency:'hourly' as const,priority:.8})),...stories.map(s=>({url:`${base}/noticia/${s.slug}`,lastModified:new Date(s.modifiedAt||s.publishedAt),changeFrequency:'daily' as const,priority:.7}))];}
