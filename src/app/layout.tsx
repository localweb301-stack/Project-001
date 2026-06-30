import "../../index.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SiteGet News",
  description: "Latest news and updates",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 font-sans">
        {children}
      </body>
    </html>
  );
}
