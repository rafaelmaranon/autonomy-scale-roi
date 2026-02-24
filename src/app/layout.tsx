import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "An interactive simulator for exploring autonomous vehicle scale economics, ramp dynamics, and real-world deployment constraints.";

export const metadata: Metadata = {
  metadataBase: new URL("https://autonomy-scale-roi.vercel.app"),
  title: "Autonomy Scale ROI",
  description,
  openGraph: {
    type: "website",
    url: "https://autonomy-scale-roi.vercel.app/",
    siteName: "Autonomy Scale ROI",
    title: "Autonomy Scale ROI",
    description,
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Autonomy Scale ROI — interactive autonomy economics simulator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Autonomy Scale ROI",
    description,
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
