const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const SUPPORTED_LOCALES = ['en-US', 'zh-CN'];

const menu = require('./locales/menu');
const app = require('./locales/app');
const tray = require('./locales/tray');
const dialog = require('./locales/dialog');
const log = require('./locales/log');
const settings = require('./locales/settings');

// 统一的翻译对象
const translations = {
  menu,
  app,
  tray,
  dialog,
  log,
  settings,
};

// 将统一格式转换为单语言格式
function extractLocale(obj, locale) {
  const result = {};

  function extract(src, target) {
    for (const key in src) {
      if (typeof src[key] === 'object') {
        if (src[key][locale]) {
          target[key] = src[key][locale];
        } else {
          target[key] = {};
          extract(src[key], target[key]);
        }
      }
    }
  }

  extract(obj, result);
  return result;
}

// 生成翻译文件
function generateLocales() {
  ensureDirectoryExists(LOCALES_DIR);

  SUPPORTED_LOCALES.forEach((locale) => {
    const localeDir = path.join(LOCALES_DIR, locale);
    ensureDirectoryExists(localeDir);

    const localeTranslations = extractLocale(translations, locale);

    fs.writeFileSync(
      path.join(localeDir, 'translation.json'),
      JSON.stringify(localeTranslations, null, 2)
    );
  });

  console.log('Locales generated successfully!');
}

// 确保目录存在
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

generateLocales();
