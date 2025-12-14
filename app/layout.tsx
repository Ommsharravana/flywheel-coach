import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Flywheel Coach | AI-Powered Problem-to-Impact Learning",
  description: "Transform real-world problems into working AI solutions with guided coaching. Master the 8-step Problem-to-Impact Flywheel methodology.",
  keywords: ["AI learning", "problem solving", "entrepreneurship", "vibe coding", "JKKN"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
