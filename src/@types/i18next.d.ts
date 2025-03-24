import 'i18next';

import { resources, enTranslation, defaultNS } from '@/i18n';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)['en'];
  }
}
