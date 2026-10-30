import { defineConfig } from 'vite'

export default defineConfig({
    base: './',
    build: {
        rollupOptions: {
            input: {
                popup: 'index.html',
                content: 'src/content.ts',
            },
            output: {
                entryFileNames: '[name].js',
            },
        },
    },
})