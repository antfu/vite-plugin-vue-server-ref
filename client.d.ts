declare module 'server-ref:*' {
  import type { ServerRef } from 'vite-plugin-vue-server-ref'
  const ref: ServerRef<unknown>
  export default ref
}
