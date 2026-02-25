import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Wild Rift Draft Assistant",
  description:
    "A deterministic, explainable Wild Rift draft assistant with multi-factor scoring engine for competitive champion selection.",
};

import { TRPCProvider } from "@/lib/trpc/TRPCProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased text-zinc-100 bg-zinc-950`}>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
