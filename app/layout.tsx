import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Incentio — Trova i fondi pubblici per la tua azienda",
  description:
    "Monitoriamo ogni giorno centinaia di bandi su tecnologia, sostenibilità e formazione AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        {/* ChatWidget rimosso — il chatbot è ora contestuale nelle singole pagine (ChatPanel) */}
      </body>
    </html>
  );
}
