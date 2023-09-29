import {defineConfig} from 'vite'
import preact from '@preact/preset-vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import {resolve} from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      name: 'Simpler',
      entry: resolve(__dirname, 'src/index.tsx'),
    },
    sourcemap: true
  },
  plugins: [
    preact(),
    viteStaticCopy({
      targets: [
        {
          src: resolve(__dirname, './src/descriptor.json'),
          dest: './',
        },
        {
          src: resolve(__dirname, './src/phase-vocoder.js'),
          dest: './',
        },
      ],
    }),
  ],
})
