import type { Metadata, Viewport } from "next";
import { MedievalSharp, Kufam } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const medievalSharp = MedievalSharp({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const kufam = Kufam({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lunhaw — Public Spaces & Green Mobility",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`js ${medievalSharp.variable} ${kufam.variable}`}>
      <head>
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
