import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  return {
    build: {
      lib: {
        entry: './src/index.ts',
        formats: ['cjs', 'es'],
      },
    },
  }
})
