import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
export const metadata:Metadata={title:{default:'Periodismo360',template:'%s | Periodismo360'},description:'Noticias nacionales e internacionales con visión 360°.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body><Header/><main>{children}</main><Footer/></body></html>}
