import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Plugin to ensure 404.html is automatically generated in dist for Cloudflare / GitHub / Vercel SPA routing
function spaFallbackPlugin() {
  return {
    name: 'spa-fallback',
    closeBundle() {
      try {
        const distDir = path.resolve(__dirname, 'dist');
        const indexPath = path.join(distDir, 'index.html');
        const fallbackPath = path.join(distDir, '404.html');
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, fallbackPath);
        }
      } catch (err) {
        console.warn('Could not copy 404.html fallback:', err);
      }
    },
  };
}

// Plugin to persist custom logo PNG icons (192, 512, maskable, apple-touch) to public/ directory for WebAPK and PWA minting
function logoAssetsPlugin() {
  return {
    name: 'logo-assets-saver',
    configureServer(server: any) {
      server.middlewares.use('/api/save-logo-assets', (req: any, res: any) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const { icon192, icon512, iconMaskable, appleIcon } = JSON.parse(body);
              const publicDir = path.resolve(__dirname, 'public');
              const saveBase64 = (filePath: string, base64Data: string) => {
                if (!base64Data || typeof base64Data !== 'string') return;
                const match = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (match && match[2]) {
                  fs.writeFileSync(filePath, Buffer.from(match[2], 'base64'));
                }
              };
              saveBase64(path.join(publicDir, 'pwa-192x192.png'), icon192);
              saveBase64(path.join(publicDir, 'pwa-512x512.png'), icon512);
              saveBase64(path.join(publicDir, 'pwa-maskable-512x512.png'), iconMaskable);
              saveBase64(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
              saveBase64(path.join(publicDir, 'logo.png'), icon512);

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end();
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    base: process.env.VITE_BASE_PATH || '/',
    plugins: [
      react(),
      tailwindcss(),
      spaFallbackPlugin(),
      logoAssetsPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'বন্ধু সমবায় সমিতি - সফটওয়্যার',
          short_name: 'বন্ধু সমিতি',
          description: 'বন্ধু সমবায় সমিতি - সঞ্চয়, ঋণ, কিস্তি এবং আর্থিক হিসাব ব্যবস্থাপনা',
          theme_color: '#1b2a59',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
            ui: ['lucide-react', 'canvas-confetti', 'xlsx'],
            pdf: ['jspdf', 'html-to-image'],
          },
        },
      },
    },
    server: {
      hmr: false,
    },
  };
});
