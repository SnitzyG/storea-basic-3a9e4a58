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
    
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate vendor libraries into their own chunks
          if (id.includes('node_modules')) {
            // Large PDF libraries
            if (id.includes('pdfjs-dist')) {
              return 'vendor-pdf';
            }
            
            // Excel/file processing
            if (id.includes('xlsx') || id.includes('jszip')) {
              return 'vendor-excel';
            }
            
            // Maps
            if (id.includes('leaflet')) {
              return 'vendor-maps';
            }
            
            // Charts
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            
            // Image processing
            if (id.includes('html2canvas') || id.includes('jspdf')) {
              return 'vendor-imaging';
            }
            
            // Radix UI components (group together)
            if (id.includes('@radix-ui')) {
              return 'vendor-radix';
            }
            
            // Supabase
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            
            // All other node_modules
            return 'vendor-other';
          }
        },
      },
    },
    
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Remove console.logs in production
        drop_debugger: true,
      },
    },
  },
}));
