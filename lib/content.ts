export type Category = 'Nacionales'|'Económicas'|'Globales'|'Deportes'|'Entretenimiento'|'Tecnología';
export type Story = { id:string; slug:string; title:string; excerpt:string; content?:string; category:Category; publishedAt:string; modifiedAt?:string; image?:string; imageAlt?:string; author?:string; sourceUrl?:string; featured?:boolean };
export const categories: Category[]=['Nacionales','Económicas','Globales','Deportes','Entretenimiento','Tecnología'];
export const categorySlug=(category:Category)=>category.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const categoryFromSlug=(slug:string)=>categories.find(c=>categorySlug(c)===slug.toLowerCase());
