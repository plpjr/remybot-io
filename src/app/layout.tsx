import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ThemeProvider from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kronos | AI-Powered BTC Trading Bot",
  description:
    "Live performance dashboard for the Kronos reinforcement learning trading model. Track win rate, returns, and weekly improvements.",
  icons: {
    icon: "/kronos-icon.svg",
  },
  openGraph: {
    title: "Kronos Trading Bot",
    description: "AI-powered BTC trading with real-time performance tracking",
    url: "https://remybot.io",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-[var(--bg)] text-[var(--text)]`}>
        <ThemeProvider>
          <Sidebar />
          <main className="lg:ml-64 min-h-screen">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
