import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
          const n = id.replace(/\\/g, '/');
          // Admin code → unminified 'admin' chunk for easier production debugging
          if (n.includes('/features/admin/') || n.includes('/components/match-events/')) {
            return 'admin';
          }
          // Vendor library chunks (minified normally by Vite)
          if (n.includes('/node_modules/')) {
            if (/\/(react|react-dom|react-router-dom)\//.test(n)) return 'vendor';
            if (n.includes('/@radix-ui/')) return 'ui';
            if (n.includes('/recharts/')) return 'recharts';
            if (n.includes('/@supabase/')) return 'supabase';
            if (/\/(date-fns|lucide-react|clsx|tailwind-merge)\//.test(n)) return 'utils';
          }
        },
      },
    },
  },
}));
