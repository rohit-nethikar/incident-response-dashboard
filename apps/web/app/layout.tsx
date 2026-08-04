import type { Metadata } from "next";
import { Toaster } from "sonner";
import { SessionProviderWrapper } from "@/lib/providers/SessionProviderWrapper";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { ThemeProvider } from "@/lib/providers/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Incident Response Dashboard",
  description: "Real-time incident aggregation for GCP and Tableau administrators",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-plane text-text-primary font-sans antialiased">
        <ThemeProvider>
          <SessionProviderWrapper>
            <QueryProvider>
              {children}
              <Toaster richColors position="top-right" theme="system" />
            </QueryProvider>
          </SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
