import i18next from 'i18next';

import enTranslation from '../locales/en-US/translation.json';
import zhTranslation from '../locales/zh-CN/translation.json';

const resources = {
  en: { translation: enTranslation },
  zh: { translation: zhTranslation },
};

const defaultNS = 'translation';

const initI18n = async (config: any) => {
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
const t = i18next.t;

export { initI18n, i18next, t, resources, defaultNS };
