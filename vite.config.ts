import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000, // 1000kb instead of default 500kb
    
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    
    // Enable CSS code splitting for faster rendering
    cssCodeSplit: true,
    
    // Optimize asset inlining (4kb threshold)
    assetsInlineLimit: 4096,
    
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Core React + React ecosystem that MUST be together
            if (id.includes('react') || 
                id.includes('react-dom') || 
                id.includes('scheduler') ||
                id.includes('@tanstack/react-query') ||
                id.includes('react-router')) {
              return 'vendor-react';
            }
            // UI libraries with React dependencies
            if (id.includes('@radix-ui') || 
                id.includes('sonner') ||
                id.includes('cmdk') ||
                id.includes('vaul') ||
                id.includes('react-hook-form') ||
                id.includes('react-day-picker') ||
                id.includes('react-dropzone') ||
                id.includes('embla-carousel-react') ||
                id.includes('input-otp') ||
                id.includes('react-resizable-panels')) {
              return 'vendor-ui';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // Heavy/lazy-loaded libraries
            if (id.includes('pdfjs-dist')) return 'vendor-pdf';
            if (id.includes('xlsx') || id.includes('jszip')) return 'vendor-excel';
            if (id.includes('leaflet')) return 'vendor-maps';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('html2canvas') || id.includes('jspdf')) return 'vendor-imaging';
            
            // All other (non-React) node_modules
            return 'vendor-other';
          }
        },
        
        // Add asset naming for better caching
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'entries/[name]-[hash].js',
      },
    },
    
    // Minification settings (esbuild is faster and built-in)
    minify: 'esbuild',
    esbuild: {
      legalComments: 'none', // Remove comments for smaller bundles
    },
  },
}));
