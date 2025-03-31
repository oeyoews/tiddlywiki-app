import i18next from 'i18next';

const defaultNS = 'translation';

const initI18n = async (config: any) => {
  const enTranslation = await import('@/locales/en-US/translation.json');
  const zhTranslation = await import('@/locales/zh-CN/translation.json');

  const resources = {
    en: { translation: enTranslation },
    zh: { translation: zhTranslation },
  };

  await i18next.init({
    resources,
    lng: config.get('language') || 'en-US',
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false,
    },
  });

  return i18next;
};
// const t = i18next.t;

export { initI18n, i18next, defaultNS };
