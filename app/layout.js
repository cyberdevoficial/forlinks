import './globals.css';
import { Bricolage_Grotesque, Geist, Geist_Mono } from 'next/font/google';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const sans = Geist({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

const base = process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : 'http://localhost:3000';

export const metadata = { metadataBase: new URL(base), title: 'Cyberdev — Links' };
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#06070A', colorScheme: 'dark' };

export default function RootLayout({ children }) {
  return (
    <html lang='pt-BR' className={display.variable + ' ' + sans.variable + ' ' + mono.variable}>
      <body>{children}</body>
    </html>
  );
}
