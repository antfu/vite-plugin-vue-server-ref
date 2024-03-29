import type { Connect } from 'vite'
import { parseQuery, parseURL } from 'ufo'
import { parse } from './client'
import { PREFIXES } from './constant'

export function getBodyJson(req: Connect.IncomingMessage) {
  return new Promise<any>((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('error', reject)
    req.on('end', () => {
      try {
        resolve(parse(body) || {})
      }
      catch (e) {
        reject(e)
      }
    })
  })
}

export function get(obj: any, key: string) {
  return key.split('.').reduce((acc, key) => acc?.[key], obj)
}

export function set(obj: any, key: string, value: any) {
  const keys = key.split('.')
  let acc = obj
  keys
    .slice(0, -1)
    .forEach((key) => {
      if (!acc[key])
        acc[key] = {}
      acc = acc[key]
    })
  acc[keys[keys.length - 1]] = value
}

export interface ParsedId {
  key: string
  type: 'ref' | 'reactive'
  prefix: string
  diff: boolean
}

export function parseId(id: string): ParsedId | undefined {
  for (const pre of PREFIXES) {
    if (id.startsWith(pre)) {
      const { pathname: key, search } = parseURL(id.substr(pre.length))
      const query = parseQuery(search)
      return {
        key: key.replace(/\//g, '.'),
        type: pre.includes('ref') ? 'ref' : 'reactive',
        prefix: pre,
        diff: 'diff' in query,
      }
    }
  }
}
