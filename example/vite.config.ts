import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import ServerRef from 'vite-plugin-vue-server-ref'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    Vue(),
    ServerRef({
      debug: true,
      state: {
        state: {
          input: '',
          items: [],
        },
      },
    }),
  ],
})
