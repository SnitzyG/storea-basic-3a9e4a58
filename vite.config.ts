import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Core React ecosystem - must load together
            if (id.includes('react') || 
                id.includes('scheduler') ||
                id.includes('@tanstack/react-query') ||
                id.includes('react-router') ||
                id.includes('next-themes') ||
                id.includes('@radix-ui') || 
                id.includes('sonner') ||
                id.includes('cmdk') ||
                id.includes('vaul') ||
                id.includes('react-hook-form') ||
                id.includes('@hookform/resolvers') ||
                id.includes('class-variance-authority') ||
                id.includes('clsx') ||
                id.includes('tailwind-merge')) {
              return 'vendor-react';
            }
            
            // Supabase
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            
            // Heavy libraries - loaded separately
            if (id.includes('pdfjs-dist') || id.includes('jspdf')) return 'vendor-pdf';
            if (id.includes('xlsx') || id.includes('jszip')) return 'vendor-excel';
            if (id.includes('leaflet')) return 'vendor-maps';
            if (id.includes('recharts')) return 'vendor-charts';
            
            // Everything else
            return 'vendor-other';
          }
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'entries/[name]-[hash].js',
      },
    },
    minify: 'esbuild',
  },
}));
