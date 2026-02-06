import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'pt-BR'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async () => {
  // Try to get locale from cookie first
  const cookieStore = cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;

  // Then try Accept-Language header
  const headersList = headers();
  const acceptLanguage = headersList.get('Accept-Language');

  let locale: Locale = defaultLocale;

  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    locale = cookieLocale as Locale;
  } else if (acceptLanguage) {
    const browserLocale = acceptLanguage.split(',')[0]?.split('-')[0];
    if (browserLocale === 'pt') {
      locale = 'pt-BR';
    } else if (locales.includes(browserLocale as Locale)) {
      locale = browserLocale as Locale;
    }
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
