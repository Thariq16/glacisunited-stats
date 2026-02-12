import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Custom Vite plugin: skip minification for admin chunks.
 * Stores pre-minification code for admin chunks via renderChunk,
 * then restores it in generateBundle (after Vite's esbuild minification).
 */
function skipAdminMinification() {
  const adminChunkCode = new Map<string, string>();
  return {
    name: 'skip-admin-minification',
    renderChunk(code: string, chunk: any) {
      if (chunk.name === 'admin' || chunk.fileName?.includes('admin')) {
        adminChunkCode.set(chunk.fileName, code);
      }
      return null;
    },
    generateBundle(_options: any, bundle: any) {
      for (const [fileName, originalCode] of adminChunkCode) {
        if (bundle[fileName]) {
          bundle[fileName].code = originalCode;
        }
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Glacis United Stats',
        short_name: 'GU Stats',
        description: 'Comprehensive Glacis United football statistics dashboard with player profiles and team analytics',
        theme_color: '#7E22CE',
        background_color: '#0A0A0B',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        importScripts: ['/sw-push.js'],
        navigateFallbackDenylist: [/^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
            },
          },
        ],
      },
    }),
    skipAdminMinification(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Admin code → unminified 'admin' chunk for easier production debugging
          if (id.includes('/features/admin/') || id.includes('/components/match-events/')) {
            return 'admin';
          }
          // Vendor library chunks (minified normally by Vite)
          if (id.includes('node_modules')) {
            if (/[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) return 'vendor';
            if (id.includes('@radix-ui/')) return 'ui';
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('@supabase/')) return 'supabase';
            if (/[\\/](date-fns|lucide-react|clsx|tailwind-merge)[\\/]/.test(id)) return 'utils';
          }
        },
      },
    },
  },
}));
