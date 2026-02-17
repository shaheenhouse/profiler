import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
});

const siteUrl = process.env.NEXTAUTH_URL || 'https://profiler.app';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Profiler - Professional Portfolio & Resume Builder | AI-Powered",
    template: "%s | Profiler",
  },
  description: "Create stunning professional portfolios, AI-powered resumes, and beautiful designs. Build your online presence with our free portfolio builder featuring AI design studio, resume extraction, and SEO-optimized public profiles.",
  keywords: [
    "portfolio builder",
    "resume builder",
    "AI resume",
    "online portfolio",
    "professional portfolio",
    "CV builder",
    "design studio",
    "AI design",
    "career portfolio",
    "developer portfolio",
    "personal website builder",
    "free portfolio",
    "resume maker",
    "portfolio creator",
    "professional resume",
  ],
  authors: [{ name: "Profiler" }],
  creator: "Profiler",
  publisher: "Profiler",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Profiler",
    title: "Profiler - Professional Portfolio & Resume Builder",
    description: "Create stunning professional portfolios and AI-powered resumes. Build your online presence for free.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Profiler - Professional Portfolio & Resume Builder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Profiler - Professional Portfolio & Resume Builder",
    description: "Create stunning professional portfolios and AI-powered resumes. Build your online presence for free.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "technology",
};

// JSON-LD structured data for the website
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Profiler",
  description: "Professional portfolio and resume builder with AI-powered design studio",
  url: siteUrl,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "AI-powered design studio",
    "Professional resume builder",
    "Portfolio hosting",
    "PDF export",
    "Multiple resume templates",
    "AI resume data extraction",
    "SEO-optimized public profiles",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
