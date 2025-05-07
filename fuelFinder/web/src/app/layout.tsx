import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../../components/NavBar";
import { AuthProvider } from "./lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FuelFinder",
  description: "Find the best fuel prices around you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`flex flex-col h-screen ${geistSans.variable} ${geistMono.variable} antialiased bg-[#1f1f2e] text-white`}
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-1 overflow-hidden">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
