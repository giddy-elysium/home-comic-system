import type { Metadata } from "next";
import { Bangers, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Bangers({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display"
});

const body = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Back Issue Radar",
  description: "Comic collection tracking, gap discovery, and marketplace-guided back issue hunting."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
