import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EuPeptides - Premium Peptide Products",
  description: "Browse and purchase high-quality peptide products for research and wellness",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
        <AuthProvider>
          <CurrencyProvider>
          <CartProvider>
            <Header />
            <main className="min-h-screen bg-gray-50">
              {children}
            </main>
            <Footer />
          </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
