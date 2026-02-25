import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Wild Rift Draft Assistant",
  description:
    "A deterministic, explainable Wild Rift draft assistant with multi-factor scoring engine for competitive champion selection.",
};

import { TRPCProvider } from "@/lib/trpc/TRPCProvider";
import { Background } from "@/components/ui/background";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${spaceGrotesk.variable} font-sans antialiased text-zinc-100 bg-transparent h-full overflow-hidden`}>
        <Background />
        <TooltipProvider>
          <TRPCProvider>{children}</TRPCProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
