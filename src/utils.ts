import type { Connect } from 'vite'

export function getBodyJson(req: Connect.IncomingMessage) {
  return new Promise<any>((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('error', reject)
    req.on('end', () => {
      try {
        resolve(JSON.parse(body) || {})
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
  keys.forEach((key) => {
    if (!acc[key])
      acc[key] = {}
    acc = acc[key]
  })
  acc[keys[keys.length - 1]] = value
}
