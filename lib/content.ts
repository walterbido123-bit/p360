export type Category = 'Nacionales'|'Económicas'|'Globales'|'Deportes'|'Entretenimiento'|'Tecnología';
export type Story = { id:string; slug:string; title:string; excerpt:string; category:Category; publishedAt:string; image?:string; featured?:boolean };

export const categories: Category[]=['Nacionales','Económicas','Globales','Deportes','Entretenimiento','Tecnología'];

export const stories: Story[]=[
 {id:'1',slug:'periodismo360-baseline',title:'Periodismo360 inicia una nueva etapa digital',excerpt:'Baseline editorial para probar la nueva arquitectura desacoplada sin modificar el WordPress de producción.',category:'Nacionales',publishedAt:'2026-09-10',featured:true},
 {id:'2',slug:'ia-redaccion',title:'IA y automatización transforman las redacciones digitales',excerpt:'La nueva plataforma queda preparada para integrar investigación, edición, verificación, SEO y multimedia mediante agentes.',category:'Tecnología',publishedAt:'2026-09-10'},
 {id:'3',slug:'deportes-tiempo-real',title:'Datos deportivos en tiempo real para una cobertura 360°',excerpt:'La arquitectura separa presentación y datos para integrar fútbol, MLB, NBA y ligas del Caribe.',category:'Deportes',publishedAt:'2026-09-10'},
 {id:'4',slug:'economia-digital',title:'Economía digital: nuevos modelos para medios independientes',excerpt:'Suscripciones, publicidad, branded content y productos digitales requieren una plataforma medible y rápida.',category:'Económicas',publishedAt:'2026-09-10'},
 {id:'5',slug:'agenda-global',title:'Una portada preparada para seguir la agenda global',excerpt:'El modelo editorial permite combinar actualidad dominicana, Estados Unidos, España e información internacional.',category:'Globales',publishedAt:'2026-09-10'},
 {id:'6',slug:'cultura-entretenimiento',title:'Cultura y entretenimiento ganan un espacio visual propio',excerpt:'Bloques modulares permiten variar jerarquías sin duplicar plantillas ni lógica editorial.',category:'Entretenimiento',publishedAt:'2026-09-10'}
];

export const byCategory=(category:Category)=>stories.filter(s=>s.category===category);
