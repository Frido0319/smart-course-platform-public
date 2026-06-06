import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Course Platform",
  description: "Activation-code protected interactive course platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
