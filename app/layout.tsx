import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "L.I.O.N. | Lionfish Detection Control Surface",
  description:
    "Hybrid reef-monitoring home for uploaded footage, annotated detections, and marine ML analysis surfaces.",
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
