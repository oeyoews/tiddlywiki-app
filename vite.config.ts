import { defineConfig } from 'vite';
import path from 'path';
import pkg from './package.json';
import electron from 'vite-plugin-electron';

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    plugins: [
      electron({
        entry: {
          'main/index': 'src/main/index.ts',
          'preload/index': 'src/preload/index.js',
          'renderer/index': 'src/renderer/index.js',
        },
        vite: {
          resolve: {
            alias: {
              '@': path.resolve(__dirname, 'src'),
            },
          },
          build: {
            emptyOutDir: true,
            minify: isBuild,
            outDir: 'dist',
            rollupOptions: {
              external: Object.keys(
                'dependencies' in pkg ? pkg.dependencies : {}
              ),
            },
          },
        },
      }),
    ],
    // build: {
    //   // watch: {},
    //   outDir: 'dist',
    //   // emptyOutDir: false,
    //   // minify: 'esbuild',
    //   // minify: false,
    //   // minify: process.env.NODE_ENV === 'production' ? 'esbuild' : false,
    //   assetsInlineLimit: 0, // 禁止资源内联，避免图片被转为 base64
    //   target: 'node18',
    //   // assetsDir: 'assets', // 静态资源目录
    //   rollupOptions: {
    //     // input: {
    //     //   main: 'src/main/index.js',
    //     // },
    //     // output: {
    //     //   entryFileNames: 'index.js',
    //     //   format: 'cjs',
    //     // },
    //     input: {
    //       'main/index': 'src/main/index.ts',
    //       'preload/index': 'src/preload/index.js',
    //       'renderer/index': 'src/renderer/index.js',
    //     },
    //     output: {
    //       dir: 'dist',
    //       format: 'cjs',
    //       sourcemap: false,
    //       entryFileNames: '[name].js', // 保持原文件名
    //     },
    //     external: [
    //       ...Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
    //       'electron',
    //       'path',
    //       'fs',
    //       'url',
    //       'node:process',
    //       'node:os',
    //       'node:fs',
    //       'node:url',
    //       'node:path',
    //       'node:util',
    //     ],
    //   },
    // },
  };
});
