import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const fetchPatchPlugin = () => ({
  name: 'fetch-patch-plugin',
  transformIndexHtml() {
    return [
      {
        tag: 'script',
        injectTo: 'head-prepend' as const,
        children: `
          (function() {
            window.addEventListener('error', function(event) {
              if (event && event.message && event.message.includes('fetch') && event.message.includes('getter')) {
                event.stopImmediatePropagation();
                if (typeof event.preventDefault === 'function') event.preventDefault();
                return true;
              }
            }, true);
            window.addEventListener('unhandledrejection', function(event) {
              if (event && event.reason && event.reason.message && event.reason.message.includes('fetch') && event.reason.message.includes('getter')) {
                event.stopImmediatePropagation();
                if (typeof event.preventDefault === 'function') event.preventDefault();
              }
            }, true);
            try {
              var proto = window;
              while (proto) {
                var desc = Object.getOwnPropertyDescriptor(proto, 'fetch');
                if (desc && desc.get && !desc.set) {
                  Object.defineProperty(proto, 'fetch', {
                    get: desc.get,
                    set: function(val) {
                      try {
                        Object.defineProperty(this, 'fetch', {
                          value: val, writable: true, configurable: true, enumerable: true
                        });
                      } catch (e) {}
                    },
                    configurable: true,
                    enumerable: desc.enumerable
                  });
                }
                proto = Object.getPrototypeOf(proto);
              }
            } catch (e) {}
          })();
        `
      }
    ];
  }
});

export default defineConfig(() => {
  return {
    plugins: [fetchPatchPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
