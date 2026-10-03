import type { Metadata } from "next";
import { Geist, Lora } from "next/font/google";
import { getThemeMode } from "@/features/theme/server";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const serif = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: { default: "InsightFlow", template: "%s · InsightFlow" },
  description: "Capture, connect, and revisit the ideas that help you grow.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = await getThemeMode();
  return (
    <html lang="en" data-theme={theme} className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
