import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = new URL(
  'https://perimeteriq-operations-portal.hmj-sk.chatgpt.site',
);
const title = 'PerimeterIQ · Operations Portal';
const description =
  'Manager and Admin workspace for the PerimeterIQ Smart Manning prototype.';

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title,
  description,
  alternates: { canonical: siteUrl },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'PerimeterIQ',
    title,
    description,
    images: [
      {
        url: new URL('/og.png', siteUrl).toString(),
        width: 1200,
        height: 630,
        alt: 'PerimeterIQ Smart Manning Operations Portal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [new URL('/og.png', siteUrl).toString()],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
