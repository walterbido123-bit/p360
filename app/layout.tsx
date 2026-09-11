import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://periodismo360.com');
const isProduction = ['periodismo360.com', 'www.periodismo360.com'].includes(siteUrl.hostname.toLowerCase());

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: 'Periodismo360', template: '%s | Periodismo360' },
  description: 'Noticias nacionales e internacionales con visión 360°.',
  robots: isProduction
    ? { index: true, follow: true }
    : { index: false, follow: false, noarchive: true },
  openGraph: { siteName: 'Periodismo360', locale: 'es_DO', type: 'website' },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body><Header/><main>{children}</main><Footer/></body></html>;
}
