import fs from 'fs';
import path from 'path';
import { dialog } from 'electron';
import matter from 'gray-matter';

const defaultIgnoreFolders: string[] = [
  'node_modules',
  '.vscode',
  '.git',
  '.idea',
];

type FlattenObject = Record<string, any>;

type MarkdownFile = {
  title: string;
  text: string;
  modified: string;
  created: string; // 添加创建时间字段
  tags?: string[];
} & FlattenObject;

export async function readMarkdownFolder(
  dirPath: string | null = null,
  ignoreFolders: string[] = defaultIgnoreFolders
): Promise<MarkdownFile[]> {
  if (!dirPath) {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return [];
    dirPath = result.filePaths[0];
  }

  const mdFiles: MarkdownFile[] = [];

  function readDir(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const text = fs.readFileSync(fullPath, 'utf-8');
        const { data: fields, content: body } = matter(text);
        const stats = fs.statSync(fullPath);

        const modified = (new Date(stats.mtime) || new Date())
          .toISOString()
          .replace(/\D/g, '');

        const created = (new Date(stats.birthtime) || new Date())
          .toISOString()
          .replace(/\D/g, '');

        const mdFile: MarkdownFile = {
          title: entry.name.slice(0, -3),
          text: body,
          created,
          ...fields,
          modified,
        };

        if (mdFile.tags && Array.isArray(mdFile.tags)) {
          mdFile.tags = mdFile.tags.map((tag) => tag.replace(/`/g, ''));
        }
        mdFiles.push(mdFile);
      } else if (
        entry.isDirectory() &&
        !ignoreFolders.includes(entry.name) &&
        !entry.name.startsWith('.')
      ) {
        readDir(fullPath);
      }
    }
  }

  readDir(dirPath);
  return mdFiles;
}
