import type { Metadata } from "next";
import { Inter, Crimson_Text } from "next/font/google";
import "./globals.css";
import { DecorativeElements } from "./decorative-elements";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const crimson = Crimson_Text({
  weight: ["400", "600", "700"],
  variable: "--font-crimson",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "La Cafeta - Gestión",
  description: "Sistema de gestión de cantina",
};

export const revalidate = 0;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${crimson.variable} antialiased`}
    >
      <body className="font-sans">
        <DecorativeElements />
        {children}
      </body>
    </html>
  );
}
