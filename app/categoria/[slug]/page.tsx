import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StoryCard } from '@/components/StoryCard';
import { getStoriesByCategory } from '@/lib/wordpress';
export const revalidate=300;
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const data=await getStoriesByCategory(slug);if(!data)return {};return {title:data.category,description:`Últimas noticias de ${data.category} en Periodismo360.`,alternates:{canonical:`/categoria/${slug}`},openGraph:{title:`${data.category} | Periodismo360`,type:'website'}};}
export default async function CategoryPage({params}:Props){const {slug}=await params;const data=await getStoriesByCategory(slug);if(!data)notFound();return <div className="container"><header className="archiveHeader"><span className="eyebrow">Sección</span><h1>{data.category}</h1><p>Últimas noticias y análisis de {data.category.toLowerCase()}.</p></header><div className="grid3">{data.stories.map(s=><StoryCard key={s.id} story={s}/>)}</div></div>}
