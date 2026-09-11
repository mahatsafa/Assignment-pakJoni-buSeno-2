import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: `${siteConfig.className} | Class Portfolio`,
    template: `%s | ${siteConfig.className}`,
  },
  description: siteConfig.description,
  applicationName: `${siteConfig.className} Class Portfolio`,
  keywords: ["XI TKJ 3", "profil kelas", "TKJ", "portfolio siswa", "Next.js"],
  openGraph: {
    title: `${siteConfig.className} Class Portfolio`,
    description: siteConfig.description,
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
