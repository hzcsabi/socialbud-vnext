import type { Metadata } from "next";
import "./globals.css";
import { AuthHashHandler } from "@/app/auth/callback/auth-hash-handler";

export const metadata: Metadata = {
  title: "Socialbud",
  description: "Socialbud vNext",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthHashHandler />
        {children}
      </body>
    </html>
  );
}
