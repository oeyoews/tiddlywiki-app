import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    // emptyOutDir: false,
    minify: 'esbuild',
    // minify: false,
    assetsInlineLimit: 0, // 禁止资源内联，避免图片被转为 base64
    // target: 'es2020',
    // assetsDir: 'assets', // 静态资源目录
    rollupOptions: {
      input: {
        main: 'src/main/index.js',
      },
      output: {
        entryFileNames: 'index.js',
        format: 'cjs',
      },
      external: ['electron', 'path', 'fs', 'url'],
    },
  },
});
