import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@/lib': resolve('src/main/lib'),
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {},
  renderer: {
    assetsInclude: 'src/renderer/src/assets/**/*',
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared'),
        '@/assets': resolve('src/renderer/src/assets'),
        '@/components': resolve('src/renderer/src/components'),
        '@/hooks': resolve('src/renderer/src/hooks'),
        '@/store': resolve('src/renderer/src/store'),
        '@/mocks': resolve('src/renderer/src/mocks')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
