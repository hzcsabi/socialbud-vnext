import type { Metadata } from "next";
import "./globals.css";
import { AuthHashHandler } from "@/app/auth/callback/auth-hash-handler";

export const metadata: Metadata = {
  title: "Socialbud",
  description: "Socialbud vNext",
  icons: {
    icon: "/favico.png",
  },
};

// Run before first paint to avoid light-mode flash. Inline in <head> so it runs before body is painted.
const themeScript = `
(function() {
  var d = document.documentElement;
  var m = window.matchMedia('(prefers-color-scheme: dark)');
  function set() { d.classList.toggle('dark', m.matches); }
  set();
  m.addEventListener('change', set);
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          id="theme-system"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body className="antialiased">
        <AuthHashHandler />
        {children}
      </body>
    </html>
  );
}
