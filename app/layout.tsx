import type { Metadata } from 'next';
import { Saira_Condensed, Public_Sans, Space_Mono } from 'next/font/google';
import './globals.css';

const display = Saira_Condensed({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});
const body = Public_Sans({
  variable: '--font-body',
  subsets: ['latin'],
});
const mono = Space_Mono({
  variable: '--font-mono-serial',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'TicketChain — Taquilla',
  description: 'Taquilla de eventos: emisión y verificación de boletos on-chain',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
