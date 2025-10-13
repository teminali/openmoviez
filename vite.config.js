// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The configuration is now simplified as we no longer need WebTorrent polyfills.
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
});
