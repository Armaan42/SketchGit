import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SessionProvider from "@/components/auth/SessionProvider";
import "./globals.css";
import "tldraw/tldraw.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SketchGit — GitHub-Native Visual Workspace",
  description:
    "An infinite canvas where every page is a JSON file committed to your GitHub repo. Diagrams that live with your code, with free version history via commits.",
  keywords: ["diagram", "sketch", "github", "whiteboard", "tldraw", "visual workspace"],
  openGraph: {
    title: "SketchGit",
    description: "GitHub-native visual workspace. Diagrams that live with your code.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/tldraw@5.1.1/tldraw.css" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
