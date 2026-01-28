import path from 'path';
import checker from 'vite-plugin-checker';
import { loadEnv, defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// ----------------------------------------------------------------------

const env = loadEnv('all', process.cwd()); // Load environment variables
const PORT = parseInt(env.VITE_PORT || '3030', 10); // Ensure PORT is a number

export default defineConfig({
  base: env.VITE_BASE_PATH || '/', // Set the base path (useful when deploying to subdirectories)
  plugins: [
    react(), // React with SWC for faster builds
    checker({
      typescript: true, // Enable TypeScript type checking
      eslint: {
        lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"', // Lint command for source files
      },
      overlay: {
        position: 'tl', // Error overlay at top-left of the screen
        initialIsOpen: false, // Do not open overlay by default
      },
    }),
  ],
  resolve: {
    alias: [
      {
        find: /^~(.+)/,
        replacement: path.resolve(process.cwd(), 'node_modules/$1'), // Resolve ~ to node_modules
      },
      {
        find: /^src\/(.+)/,
        replacement: path.resolve(process.cwd(), 'src/$1'), // Resolve src to absolute path for src/
      },
    ],
  },
  define: {
    'process.env': process.env
  },
  server: {
    port: PORT, // Use port defined in .env or 3030, and ensure it's a number
    host: '0.0.0.0', // Allow external access (useful for Docker)
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  preview: {
    port: PORT, // Same port for preview, ensure it's a number
    host: '0.0.0.0', // Allow external access in preview as well
  },
});
