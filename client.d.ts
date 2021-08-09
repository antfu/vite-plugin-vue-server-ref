declare module 'server-ref:*' {
  import type { Ref } from 'vue'
  type ServerRef<T> = Ref<T> & {
    syncDown: boolean
    syncUp: boolean
    onChange(data: T): void
    onPatch(patch: Partial<T>): void
    patch(patch: Partial<T>): Promise<boolean>
  }
  const ref: ServerRef<any>
  export default ref
}
