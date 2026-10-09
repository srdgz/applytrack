import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "vue-i18n": "vue-i18n/dist/vue-i18n.runtime.esm-bundler.js",
    },
  },
  define: {
    __VUE_I18N_FULL_INSTALL__: true,
    __VUE_I18N_LEGACY_API__: false,
    __INTLIFY_PROD_DEVTOOLS__: false,
  },
  build: {
    manifest: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
