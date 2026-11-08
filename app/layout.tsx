import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Myanmar } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSansMyanmar = Noto_Sans_Myanmar({
  variable: "--font-noto-sans-myanmar",
  display: "swap",
  subsets: ["myanmar"],
  weight: ["400", "500", "600", "700"],
});

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Grace",
  description:
    "A private space for shared Bible study, prayer, and worship planning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${notoSans.variable} ${notoSansMyanmar.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
