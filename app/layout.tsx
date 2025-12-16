import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";

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
      <body className="min-h-screen bg-background antialiased">
        <ImpersonationBanner />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
