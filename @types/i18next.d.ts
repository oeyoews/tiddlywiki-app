import 'i18next';

import { defaultNS } from '@/i18n';

import enTranslation from '../src/locales/en-US/translation.json';
import zhTranslation from '../src/locales/zh-CN/translation.json';

const resources = {
  en: { translation: enTranslation },
  zh: { translation: zhTranslation },
};

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)['en'];
  }
}
