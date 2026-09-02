import type { Metadata } from "next";
import { Playfair_Display, Libre_Franklin, IBM_Plex_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
import { ChromeProvider } from "@/components/ChromeLabels";
import { BrandProvider, type Brand } from "@/components/Brand";
import { getChromeLabels } from "@/lib/translate.server";
import { LOCALE_COOKIE, isLocale, DEFAULT_LOCALE, localeByCode } from "@/lib/i18n";

// Newspaper pairing: Playfair Display (high-contrast masthead/display serif)
// + Libre Franklin (Franklin Gothic-heritage body sans) + IBM Plex Mono for
// the small editorial labels. Semantic variable names so globals.css maps
// them without caring which faces are loaded.
const displayFace = Playfair_Display({
  variable: "--font-display-src",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const bodyFace = Libre_Franklin({
  variable: "--font-body-src",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const monoFace = IBM_Plex_Mono({
  variable: "--font-mono-src",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

const SITE_DESCRIPTION =
  "Independent, reader-funded investigative journalism — long-form ground reportage from Jharkhand and eastern India by Abhishek Angad.";

export const metadata: Metadata = {
  metadataBase: new URL("https://reporters-desk.org"),
  title: {
    default: "ReportersDesk · Abhishek Angad Ink",
    template: "%s · ReportersDesk",
  },
  description: SITE_DESCRIPTION,
  applicationName: "ReportersDesk",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "ReportersDesk",
    title: "ReportersDesk · Abhishek Angad Ink",
    description: SITE_DESCRIPTION,
    url: "https://reporters-desk.org",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "ReportersDesk — independent, reader-funded journalism" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReportersDesk · Abhishek Angad Ink",
    description: SITE_DESCRIPTION,
    images: ["/og-default.jpg"],
  },
  // Discourage Chrome auto-translate, which rewrites text nodes before React
  // hydrates and triggers React #418 text-mismatch crashes. i18n is handled
  // server-side via the locale cookie, so browser translation isn't needed.
  other: { google: "notranslate" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dir = localeByCode(locale).dir ?? "ltr";
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  // Serve the LongPress imprint (thelongpress.org) with its own chrome; every
  // other host is Reporters Desk. Decided here from the Host header.
  const host = (await headers()).get("host")?.toLowerCase() ?? "";
  const brand: Brand = host === "thelongpress.org" || host === "www.thelongpress.org" ? "longpress" : "reportersdesk";
  // Translate the shared chrome (masthead nav, byline, footer tabs) once here
  // and provide it to the client chrome, so the whole page — not just the
  // article body — reads in the visitor's language.
  const chrome = await getChromeLabels(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      translate="no"
      suppressHydrationWarning
      className={`notranslate ${displayFace.variable} ${bodyFace.variable} ${monoFace.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans bg-stone-50 text-stone-900 selection:bg-stone-200 selection:text-stone-900">
        <BrandProvider value={brand}>
        <ChromeProvider value={chrome}>
        <main className="flex-1">
          {children}
        </main>
        <SiteChrome current={locale} />
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}</Script>
          </>
        )}
        </ChromeProvider>
        </BrandProvider>
      </body>
    </html>
  );
}
