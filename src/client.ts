export { klona as clone } from 'klona/json'
export { diff, apply } from './diff'

export const UNDEFINED = '__UNDEFINED___'

export function stringify(data: any) {
  return JSON.stringify(data, (key, value) => value === undefined ? UNDEFINED : value)
}

export function parse(json: string) {
  return JSON.parse(json, (key, value) => value === UNDEFINED ? undefined : value)
}

export function randId() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(2, 10)
}

export function isObject(obj: any) {
  return typeof obj === 'object' && obj !== null
}

export function reactiveSet(target: any, value: any) {
  const originalKeys = new Set(Object.keys(target))
  Object.keys(value).forEach(i => originalKeys.delete(i))
  Object.assign(target, value)
  for (const key of originalKeys)
    delete target[key]
}

export function define(target: any, key: string, value: any) {
  Object.defineProperty(target, key, {
    value,
    enumerable: false,
  })
}
