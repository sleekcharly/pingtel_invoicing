import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import PingLogo from '/public/images/pinglogo.png';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ping Telecoms Invoicing',
  description: 'App for Generating Ping Telecoms invoices',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Navigation bar */}
        <nav className="py-2 px-4 bg-gray-100 border border-b-gray-200">
          <Link href="/" className="flex items-center">
            <div className="relative w-[70px] h-[70px] ">
              <Image
                src={PingLogo}
                alt="Pingtel logo"
                fill
                className="object-cover"
              />
            </div>
            <p className="capitalize text-xl font-semibold">
              PingTel Invoicing
            </p>
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
