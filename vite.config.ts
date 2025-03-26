import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    // emptyOutDir: false,
    // minify: 'esbuild',
    minify: false,
    // minify: process.env.NODE_ENV === 'production' ? 'esbuild' : false,
    assetsInlineLimit: 0, // 禁止资源内联，避免图片被转为 base64
    target: 'node18',
    // assetsDir: 'assets', // 静态资源目录
    rollupOptions: {
      // input: {
      //   main: 'src/main/index.js',
      // },
      // output: {
      //   entryFileNames: 'index.js',
      //   format: 'cjs',
      // },
      input: {
        'main/index': 'src/main/index.ts',
        'preload/index': 'src/preload/index.js',
        'renderer/index': 'src/renderer/index.js',
      },
      output: {
        dir: 'dist',
        format: 'cjs',
        sourcemap: false,
        entryFileNames: '[name].js', // 保持原文件名
        // chunkFileNames: 'chunks/[name]-[hash].js',
        // assetFileNames: 'assets/[name]-[hash].[ext]',
        // preserveModules: true, // 保持目录结构
        // preserveModulesRoot: 'src',
      },
      external: [
        'electron',
        'path',
        'fs',
        'url',
        'node:process',
        'node:os',
        'node:fs',
        'node:url',
        'node:path',
        'node:util',
      ],
    },
  },
});
