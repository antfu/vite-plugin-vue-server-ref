declare module 'server-ref:*' {
  import type { Ref } from 'vue'
  type ServerRef<T> = Ref<T> & {
    syncDown: boolean
    syncUp: boolean
    paused: boolean
    onChange: (fn: (data: T) => void) => void
  }
  const ref: ServerRef<unknown>
  export default ref
}
