import type { Ref } from 'vue'

export interface ServerRefOptions<T extends Record<string, unknown>> {
  state?: T
  /**
   * Milliseconds to debounce the server ref updates.
   *
   * @default 10
   */
  debounce?: number
  /**
   * Default value for the client when the data is not presented.
   *
   * @default () => undefined
   */
  defaultValue?: (key: string) => unknown
  /**
   * Log info on the client
   */
  debug?: boolean
  /**
   * The vue entry name for the generated client code.
   *
   * @default 'vue'
   */
  clientVue?: string
  /**
   * Callback on server data change
   */
  onChanged?: <K extends keyof T>(name: K, data: T[K], patch: Partial<T[K]> | undefined, timestamp: number) => void
}

export interface ServerRefExtend<T> {
  $syncDown: boolean
  $syncUp: boolean
  $onChange: (fn: (data: T) => void) => void
  $onPatch: (fn: (patch: Partial<T>) => void) => void
  $patch: (patch: Partial<T>) => Promise<boolean>
}

export type ServerRef<T> = Ref<T> & ServerRefExtend<T>
export type ServerReactive<T> = T & ServerRefExtend<T>
