import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';

export const metadata: Metadata = {
  title: 'VIDHIVRAKSH — Law, made approachable.',
  description: 'AI-Powered Legal Awareness for India. Grounded multilingual legal information across 6 Indian languages with VIDHIVRAKSH.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F6E5D0] text-[#000000] antialiased selection:bg-[#C4A47A]/30 selection:text-[#1F3A2E]">
        <LanguageProvider>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <AuthModal />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
