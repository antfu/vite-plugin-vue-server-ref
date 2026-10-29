import type { Plugin } from 'vite'
import { EventEmitter } from 'node:events'
import { afterEach, describe, expect, it } from 'vitest'
import { apply, parse, reactiveSet } from '../src/client'
import VitePluginServerRef from '../src/index'
import { get, set } from '../src/utils'

// Key paths come from the request URL and patches from the request body, so neither may
// reach `Object.prototype` (or another shared object) through an inherited property.
const UNSAFE_PATHS = ['__proto__.polluted', 'constructor.prototype.polluted', 'toString.polluted', 'prototype.polluted']

afterEach(() => {
  delete (Object.prototype as any).polluted
  delete (Array.prototype as any).polluted
  delete (Object.prototype.toString as any).polluted
})

function expectClean() {
  expect(({} as any).polluted).toBeUndefined()
  expect(([] as any).polluted).toBeUndefined()
  expect((Object.prototype.toString as any).polluted).toBeUndefined()
}

function createMiddleware(state: Record<string, any>) {
  let middleware: any
  const plugin = VitePluginServerRef({ state }) as Plugin
  ;(plugin.configureServer as any)({
    middlewares: { use: (fn: any) => middleware = fn },
    moduleGraph: { getModuleById: () => undefined },
    ws: { send: () => {} },
  })
  return async (url: string, body: string) => {
    const req = Object.assign(new EventEmitter(), { url, method: 'POST' })
    const res = { statusCode: 200, write: () => {}, end: () => {} }
    const handled = middleware(req, res, () => {})
    req.emit('data', body)
    req.emit('end')
    await handled
    return res.statusCode
  }
}

describe('prototype', () => {
  it('set ignores key paths through a prototype', () => {
    for (const path of UNSAFE_PATHS) {
      set({}, path, true)
      expectClean()
    }
  })

  it('set creates nested state', () => {
    const state: any = { a: { keep: 1 } }
    set(state, 'a.b.c', 1)
    set(state, 'd.e', 2)
    expect(state).toEqual({ a: { keep: 1, b: { c: 1 } }, d: { e: 2 } })
  })

  it('get reads own state only', () => {
    const state = { a: { b: 1 } }
    expect(get(state, 'a.b')).toBe(1)
    expect(get(state, 'a.c')).toBeUndefined()
    expect(get(state, 'constructor')).toBeUndefined()
    expect(get(state, '__proto__')).toBeUndefined()
    expect(get(state, 'toString')).toBeUndefined()
  })

  it('parse drops __proto__ keys', () => {
    const data = parse('{"__proto__":{"polluted":true},"a":{"__proto__":{"polluted":true},"b":1}}')
    expect(data).toEqual({ a: { b: 1 } })
    expect(Object.hasOwn(data, '__proto__') || Object.hasOwn(data.a, '__proto__')).toBe(false)
  })

  it('apply skips __proto__ in a patch and keeps other keys', () => {
    const state: any = { a: 1, nested: { x: 1 } }
    apply(state, JSON.parse('{"__proto__":{"polluted":true},"nested":{"__proto__":{"polluted":true},"y":2},"constructor":2,"prototype":3}'))
    expectClean()
    expect(state).toEqual({ a: 1, nested: { x: 1, y: 2 }, constructor: 2, prototype: 3 })
  })

  it('apply skips __proto__ in an array patch', () => {
    const list: any = [1, 2]
    apply(list, JSON.parse('{"__proto__":{"polluted":true},"0":5}'))
    expectClean()
    expect(list).toEqual([5, 2])
  })

  it('reactiveSet skips __proto__', () => {
    const target: any = { a: 1 }
    reactiveSet(target, JSON.parse('{"__proto__":{"polluted":true},"a":2,"constructor":3}'))
    expect(Object.getPrototypeOf(target)).toBe(Object.prototype)
    expect(target.polluted).toBeUndefined()
    expect(target).toEqual({ a: 2, constructor: 3 })
  })

  it('the server refuses a key path through a prototype', async () => {
    const state: Record<string, any> = { nav: { page: 1 } }
    const post = createMiddleware(state)
    expect(await post('/@server-reactive/__proto__/polluted', '{"data":true}')).toBe(400)
    expect(await post('/@server-reactive/constructor/prototype/polluted', '{"data":true}')).toBe(400)
    expect(await post('/@server-ref/constructor.prototype.polluted', '{"data":true}')).toBe(400)
    expect(await post('/@server-reactive/nav', '{"patch":{"__proto__":{"polluted":true}}}')).toBe(200)
    expectClean()
    expect(await post('/@server-reactive/nav', '{"data":{"page":2}}')).toBe(200)
    expect(state.nav).toEqual({ page: 2 })
  })

  it('the server answers a bad request instead of rejecting', async () => {
    const state: Record<string, any> = { nav: { page: 1 } }
    const post = createMiddleware(state)
    expect(await post('/@server-ref/toString', '{"data":1}')).toBe(200)
    expect(await post('/@server-reactive/nav', 'not json')).toBe(400)
    expect(await post('/@server-reactive/nav/page/x', '{"data":1}')).toBe(400)
    expect(state.nav).toEqual({ page: 1 })
  })
})
