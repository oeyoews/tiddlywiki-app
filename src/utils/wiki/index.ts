import { log } from '@/utils/logger';
import { buildIndexHTMLArgs, defaultPlugins } from '@/utils/wiki/constant';
import fs from 'fs';
import path from 'path';

/**
 * enable retain-original-tiddler-path
 * @param {*} infoPath
 */
export function updateOriginalPath(infoPath: string) {
  const infoKey = 'retain-original-tiddler-path';

  let twConfigInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
  if (!twConfigInfo.config || !twConfigInfo.config?.[infoKey]) {
    twConfigInfo.config = {
      'retain-original-tiddler-path': true,
    };
    log.info('update twinfo config');
    fs.writeFileSync(infoPath, JSON.stringify(twConfigInfo, null, 4), 'utf8');
  }
}

/**
 * 检测 tiddlywiki.info 是否有效, 并修复
 * @param infoPath
 */
export function checkTWPlugins(infoPath: string) {
  let twInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
  // 插件为空的情况
  if (!twInfo.plugins || twInfo.plugins.length === 0) {
    log.info(infoPath, 'is not correct, has already fix it');
    twInfo.plugins = defaultPlugins;
  } else {
    // 插件缺少的情况
    const hasAllNesPlugins = defaultPlugins.every((item: string) =>
      twInfo.plugins.includes(item)
    );
    if (!hasAllNesPlugins) {
      log.info(infoPath, 'is missing some nessary plugins, has already fix it');
      const plugins = [...twInfo.plugins, ...defaultPlugins];
      twInfo.plugins = [...new Set(plugins)];
    }
  }
  fs.writeFileSync(infoPath, JSON.stringify(twInfo, null, 4), 'utf8');
}

export function checkBuildInfo(wikiPath: string) {
  const bootPath = path.join(wikiPath, 'tiddlywiki.info');
  let twInfo = JSON.parse(fs.readFileSync(bootPath, 'utf8'));

  // 检查并添加构建配置，修复导入的文件夹无法构建
  if (!twInfo.build || !twInfo.build.index) {
    twInfo.build = {
      ...twInfo.build,
      index: buildIndexHTMLArgs,
    };
  } else {
    if (twInfo.build.index.length !== 7) {
      twInfo.build.index = buildIndexHTMLArgs;
      log.info('update', bootPath, 'to support ignore subwiki on build');
    }
  }
  fs.writeFileSync(bootPath, JSON.stringify(twInfo, null, 4), 'utf8');
}

export function checkThemes(infoPath: string) {
  let twInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));

  // 检查并添加构建配置，修复导入的文件夹无法构建
  if (!twInfo.themes || !twInfo.themes.index) {
    twInfo.themes = ['tiddlywiki/vanilla'];
    fs.writeFileSync(infoPath, JSON.stringify(twInfo, null, 4), 'utf8');
  }
}
