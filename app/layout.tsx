import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { BugReporterWrapper } from "@/components/bug-reporter-wrapper";
import { OfflineWrapper } from "@/components/offline-wrapper";

export const metadata: Metadata = {
  title: "JKKN Solution Studio | Problem-to-Impact Learning",
  description: "Transform real-world problems into working AI solutions. Master the 8-step Problem-to-Impact Flywheel methodology with guided coaching.",
  keywords: ["JKKN", "solution studio", "problem solving", "AI learning", "vibe coding", "JKKN Institutions"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Font preloading with CORS support for html2canvas screenshot capture */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Outfit:wght@400;500;600;700;800&display=swap"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <OfflineWrapper>
          <BugReporterWrapper>
            {children}
          </BugReporterWrapper>
          <Toaster />
        </OfflineWrapper>
      </body>
    </html>
  );
}
