import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({

  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        ourTeam: path.resolve(__dirname, "our-team/index.html"),
        privacyPolicy: path.resolve(__dirname, "privacy-policy/index.html"),
      },
      output: {
        assetFileNames: 'assets/[name][extname]',
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js'
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: { additionalData: `@use "sass:math";` }
    }
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  }
})

