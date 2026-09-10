import type { Category, Story } from './content';
import { categoryFromSlug, categorySlug } from './content';

const WP_BASE=(process.env.WORDPRESS_READ_URL||'https://periodismo360.com').replace(/\/$/,'');
const API=`${WP_BASE}/wp-json/wp/v2`;

type Rendered={rendered:string};
type WPCategory={id:number;name:string;slug:string};
type WPMedia={source_url?:string;alt_text?:string;media_details?:{sizes?:Record<string,{source_url?:string}>}};
type WPAuthor={name?:string};
type WPPost={id:number;slug:string;link:string;date:string;modified:string;title:Rendered;excerpt:Rendered;content:Rendered;categories:number[];_embedded?:{'wp:featuredmedia'?:WPMedia[];author?:WPAuthor[];'wp:term'?:WPCategory[][]}};

const text=(html='')=>html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#8217;/g,"'").replace(/&#8220;|&#8221;/g,'"').replace(/\s+/g,' ').trim();
const safeHtml=(html='')=>html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<iframe[\s\S]*?<\/iframe>/gi,'').replace(/\son\w+=("[^"]*"|'[^']*')/gi,'').replace(/javascript:/gi,'');

async function wpFetch<T>(path:string,revalidate=300):Promise<T>{
 const r=await fetch(`${API}${path}`,{headers:{Accept:'application/json'},next:{revalidate}});
 if(!r.ok) throw new Error(`WordPress read API ${r.status} for ${path}`);
 return r.json() as Promise<T>;
}

function postCategory(p:WPPost):Category{
 const terms=p._embedded?.['wp:term']?.flat()||[];
 for(const t of terms){const match=categoryFromSlug(categorySlug(t.name as Category));if(match)return match;}
 return 'Nacionales';
}
function toStory(p:WPPost):Story{
 const media=p._embedded?.['wp:featuredmedia']?.[0];
 const image=media?.media_details?.sizes?.large?.source_url||media?.source_url;
 return {id:String(p.id),slug:p.slug,title:text(p.title.rendered),excerpt:text(p.excerpt.rendered),content:safeHtml(p.content.rendered),category:postCategory(p),publishedAt:p.date,modifiedAt:p.modified,image,imageAlt:media?.alt_text||text(p.title.rendered),author:p._embedded?.author?.[0]?.name||'Periodismo360',sourceUrl:p.link};
}

export async function getLatestStories(limit=12):Promise<Story[]>{return (await wpFetch<WPPost[]>(`/posts?per_page=${limit}&_embed=1`)).map(toStory);}
export async function getStory(slug:string):Promise<Story|null>{const rows=await wpFetch<WPPost[]>(`/posts?slug=${encodeURIComponent(slug)}&_embed=1`);return rows[0]?toStory(rows[0]):null;}
export async function getStoriesByCategory(slug:string,limit=18):Promise<{category:Category;stories:Story[]}|null>{
 const category=categoryFromSlug(slug); if(!category)return null;
 const cats=await wpFetch<WPCategory[]>(`/categories?slug=${encodeURIComponent(slug)}`);
 let wpCat=cats[0];
 if(!wpCat){const all=await wpFetch<WPCategory[]>('/categories?per_page=100');wpCat=all.find(c=>categorySlug(c.name as Category)===slug);}
 if(!wpCat)return {category,stories:[]};
 const posts=await wpFetch<WPPost[]>(`/posts?categories=${wpCat.id}&per_page=${limit}&_embed=1`);
 return {category,stories:posts.map(toStory)};
}
