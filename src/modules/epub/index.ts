// @ts-nocheck
import { dialog, app, BrowserWindow, shell } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import extract from 'extract-zip';
import { parseStringPromise } from 'xml2js';
import TurndownService from 'turndown';
import { config } from '@/utils/config';

const turndownService = new TurndownService();

function sanitizeFilename(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 100);
}

export async function selectEpubAndConvertToMarkdown(
  mainWindow: BrowserWindow
): Promise<void> {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: '选择 EPUB 文件',
      filters: [{ name: 'EPUB 文件', extensions: ['epub'] }],
      properties: ['openFile'],
    });

    if (canceled || filePaths.length === 0) return;

    const epubPath = filePaths[0];
    const epubName = path.basename(epubPath, '.epub');
    const desktopPath = config.get('wikiPath') || app.getPath('desktop');
    const outputDir = path.join(desktopPath, 'epub', epubName);
    const unzipDir = path.join(outputDir, 'temp');

    await extract(epubPath, { dir: unzipDir });

    const containerXml = await fs.readFile(
      path.join(unzipDir, 'META-INF/container.xml')
    );
    const containerJson = await parseStringPromise(containerXml);
    const opfRelativePath =
      containerJson.container.rootfiles[0].rootfile[0]['$']['full-path'];
    const opfFullPath = path.join(unzipDir, opfRelativePath);
    const opfDir = path.dirname(opfFullPath);

    const opfXml = await fs.readFile(opfFullPath);
    const opfJson = await parseStringPromise(opfXml);

    const manifest: Record<string, string> = {};
    for (const item of opfJson.package.manifest[0].item) {
      manifest[item['$'].id] = item['$'].href;
    }

    const spine = opfJson.package.spine[0].itemref.map(
      (item: any) => item['$'].idref
    );

    await fs.ensureDir(outputDir);

    // 用于收集章节信息的数组
    const chapters: { title: string; filename: string }[] = [];

    for (let index = 0; index < spine.length; index++) {
      const id = spine[index];
      const href = manifest[id];
      const htmlPath = path.join(opfDir, href);
      if (await fs.pathExists(htmlPath)) {
        const html = await fs.readFile(htmlPath, 'utf8');
        const md = turndownService.turndown(html);

        // 提取章节标题作为文件名，获取不到则使用序号
        const titleMatch =
          html.match(/<title>(.*?)<\/title>/i) ||
          html.match(/<h1[^>]*>(.*?)<\/h1>/i);
        let chapterTitle = titleMatch ? sanitizeFilename(titleMatch[1]) : '';
        if (!chapterTitle) chapterTitle = `chapter${index + 1}`;

        const chapterFileName = `${chapterTitle}.md`;
        const chapterOutputPath = path.join(outputDir, chapterFileName);
        await fs.writeFile(chapterOutputPath, md, 'utf8');

        // 保存章节信息
        chapters.push({
          title: titleMatch ? titleMatch[1] : `Chapter ${index + 1}`,
          filename: chapterFileName,
        });
      }
    }

    // 生成目录索引文件
    const indexContent = `# ${epubName}\n\n## 目录\n\n${chapters
      .map(
        (chapter, index) =>
          `${index + 1}. [${chapter.title}](./${chapter.filename})`
      )
      .join('\n')}`;
    await fs.writeFile(path.join(outputDir, 'index.md'), indexContent, 'utf8');

    await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '转换完成',
      message: 'EPUB 转 Markdown 成功！',
      detail: `输出文件夹路径：\n${outputDir}`,
    });
    shell.showItemInFolder(outputDir);
  } catch (err: any) {
    console.error('转换失败:', err);
    dialog.showErrorBox('转换失败', err.message || '未知错误');
  }
}
