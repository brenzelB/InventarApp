import type { Metadata } from "next";
import { Sora, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/hooks/useToast";
import { ThemeProvider } from "@/components/ThemeProvider";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inventar App",
  description: "Vollständiges Next.js Projekt mit Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full">
      <body className={`${sora.variable} ${hanken.variable} ${jetbrains.variable} font-sans min-h-screen bg-background text-foreground`}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <AppLayout>
                {children}
              </AppLayout>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

