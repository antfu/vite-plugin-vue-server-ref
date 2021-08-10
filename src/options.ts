import { ServerRefOptions } from '../dist'

export const defaultOptions: Required<ServerRefOptions<any>> = {
  state: {},
  debounce: 10,
  debug: false,
  defaultValue: () => undefined,
  clientVue: 'vue',
  onChanged: () => { },
}
export function resolveOptions(options: ServerRefOptions<any>) {
  return Object.assign({}, defaultOptions, options)
}
