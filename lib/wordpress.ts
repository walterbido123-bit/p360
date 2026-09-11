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
 const url=`${API}${path}`;
 const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'Periodismo360-Frontend/2.0'},next:{revalidate}});
 if(!r.ok) throw new Error(`WordPress read API ${r.status} for ${path}`);
 const contentType=r.headers.get('content-type')||'';
 const body=await r.text();
 if(!contentType.toLowerCase().includes('application/json')) throw new Error(`WordPress read API returned ${contentType||'unknown content type'} instead of JSON for ${path}`);
 try{return JSON.parse(body) as T;}catch{throw new Error(`WordPress read API returned invalid JSON for ${path}`);}
}

async function wpFetchOr<T>(path:string,fallback:T,revalidate=300):Promise<T>{
 try{return await wpFetch<T>(path,revalidate);}catch(error){console.warn('[wordpress-read]',error instanceof Error?error.message:String(error));return fallback;}
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

export async function getLatestStories(limit=12):Promise<Story[]>{return (await wpFetchOr<WPPost[]>(`/posts?per_page=${limit}&_embed=1`,[])).map(toStory);}
export async function getStory(slug:string):Promise<Story|null>{const rows=await wpFetchOr<WPPost[]>(`/posts?slug=${encodeURIComponent(slug)}&_embed=1`,[]);return rows[0]?toStory(rows[0]):null;}
export async function getStoriesByCategory(slug:string,limit=18):Promise<{category:Category;stories:Story[]}|null>{
 const category=categoryFromSlug(slug); if(!category)return null;
 const cats=await wpFetchOr<WPCategory[]>(`/categories?slug=${encodeURIComponent(slug)}`,[]);
 const exact=cats[0];
 const all=exact?[]:await wpFetchOr<WPCategory[]>('/categories?per_page=100',[]);
 const wpCat:WPCategory|undefined=exact??all.find(c=>categorySlug(c.name as Category)===slug);
 if(!wpCat)return {category,stories:[]};
 const posts=await wpFetchOr<WPPost[]>(`/posts?categories=${wpCat.id}&per_page=${limit}&_embed=1`,[]);
 return {category,stories:posts.map(toStory)};
}
