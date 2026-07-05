import type { Metadata } from "next";
import { Playfair_Display, Libre_Franklin, IBM_Plex_Mono } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
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

export const metadata: Metadata = {
  title: "ReportersDesk · Abhishek Angad INK",
  description: "Independent Journalism",
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

  return (
    <html
      lang={locale}
      dir={dir}
      translate="no"
      suppressHydrationWarning
      className={`notranslate ${displayFace.variable} ${bodyFace.variable} ${monoFace.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans bg-stone-50 text-stone-900 selection:bg-stone-200 selection:text-stone-900">
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
      </body>
    </html>
  );
}
