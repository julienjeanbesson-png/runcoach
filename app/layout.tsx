import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";

export const metadata: Metadata = {
  applicationName: "RunCoach",
  title: {
    default: "RunCoach",
    template: "%s | RunCoach"
  },
  description: "A simple, rule-based personal running coach that runs locally in your browser.",
  metadataBase: new URL("https://runcoach.vercel.app")
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-slate-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
