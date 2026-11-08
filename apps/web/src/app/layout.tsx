import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Lunhaw",
  description:
    "Discover your space. Explore your city. Go greener. Lunhaw helps people in Metro Manila discover parks, libraries, and shaded transit routes with radical data transparency.",
  icons: {
    icon: "/mascot.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const ENHANCE_SCRIPT = `(function(){try{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;var c=document.createElement('canvas');if(window.WebGLRenderingContext&&(c.getContext('webgl')||c.getContext('experimental-webgl')))document.documentElement.classList.add('js')}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // `js` is added before paint only when the 3D/scroll layer can run (no reduced
    // motion + WebGL); otherwise the landing page keeps its plain static layout.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ENHANCE_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Kufam:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700&family=MedievalSharp&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-bg text-fg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
