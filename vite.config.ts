import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      // Use "prompt" to avoid automatic updates that can cause white screen
      registerType: "prompt",
      injectRegister: 'auto',
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "BabyBites - Baby Nutrition & Meal Planning",
        short_name: "BabyBites",
        description: "Discover 200+ pediatrician-approved baby food recipes, meal plans, and expert parenting advice for babies aged 6-24 months.",
        theme_color: "#FF6B9D",
        background_color: "#FFF5F7",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "https://storage.googleapis.com/gpt-engineer-file-uploads/L51M0kwelTgOzVygYpkcrDBNd6g2/uploads/1760365341349-yum.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "https://storage.googleapis.com/gpt-engineer-file-uploads/L51M0kwelTgOzVygYpkcrDBNd6g2/uploads/1760365341349-yum.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,jpg,jpeg,webp,svg,gif}"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
        // CRITICAL: Don't skip waiting automatically - prevents white screen on new installs
        skipWaiting: false,
        clientsClaim: false, // Don't claim clients immediately either
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/auth/, /^\/~oauth/],
        sourcemap: false, // Disable for production
        runtimeCaching: [
          // Google Fonts - safe to cache aggressively
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Images - safe to cache
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Supabase storage - safe to cache
          {
            urlPattern: /^https:\/\/.*supabase.*\/storage\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-storage-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 14
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Google storage (icons) - safe to cache
          {
            urlPattern: /^https:\/\/storage\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-storage-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
          // REMOVED: The dangerous "app-shell-cache" for *.lovableproject.com
          // This was causing white screens by caching HTML/JS inconsistently
        ],
        importScripts: ['sw-listener.js']
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: '/index.html'
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
