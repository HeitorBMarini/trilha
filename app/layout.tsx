import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trilha · sua retrospectiva musical",
  description:
    "Seus artistas, músicas, gêneros e horários de escuta no Spotify, em qualquer época do ano, com um card para compartilhar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`dark ${inter.variable} ${bricolage.variable}`}>
      <body className="antialiased font-sans">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster theme="dark" position="bottom-center" richColors />
      </body>
    </html>
  );
}
