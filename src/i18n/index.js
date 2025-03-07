const i18next = require('i18next');
const path = require('path');
const fs = require('fs');

const loadLocales = () => {
  const resources = {};
  const localesDir = path.join(__dirname, '..', 'locales');
  
  fs.readdirSync(localesDir).forEach(lang => {
    const langPath = path.join(localesDir, lang);
    if (fs.statSync(langPath).isDirectory()) {
      resources[lang] = {
        translation: require(path.join(langPath, 'translation.json'))
      };
    }
  });
  
  return resources;
};

const initI18n = async (config) => {
  await i18next.init({
    resources: loadLocales(),
    lng: config.get('language', 'zh-CN'),
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false
    }
  });
  
  return i18next;
};

module.exports = { initI18n, i18next };