declare module 'server-ref:*' {
  import type { Ref } from 'vue'
  type ServerRef<T> = Ref<T> & {
    $syncDown: boolean
    $syncUp: boolean
    $onChange(fn: (data: T) => void): void
    $onPatch(fn: (patch: Partial<T>) => void): void
    $patch(patch: Partial<T>): Promise<boolean>
  }
  const ref: ServerRef<any>
  export default ref
}

declare module 'server-reactive:*' {
  type ServerReactive<T> = T & {
    $syncDown: boolean
    $syncUp: boolean
    $onChange(fn: (data: T) => void): void
    $onPatch(fn: (patch: Partial<T>) => void): void
    $patch(patch: Partial<T>): Promise<boolean>
  }
  const ref: ServerReactive<any>
  export default ref
}
