import type { Plugin } from 'vite'
import type { ServerRefOptions } from './types'
import { ensurePrefix, slash } from '@antfu/utils'
import { resolvePath } from 'mlly'
import { URL_PREFIX, VIRTUAL_PREFIX, WS_EVENT } from './constant'
import { apply } from './diff'
import { genCode } from './generate'
import { resolveOptions } from './options'
import { get, getBodyJson, parseId, set } from './utils'

export * from './types'

export default function VitePluginServerRef(options: ServerRefOptions<any> = {}): Plugin {
  const resolved = resolveOptions(options)

  const { state } = resolved

  const idMaps: Record<string, Set<string> | undefined> = {}

  return <Plugin>{
    name: 'vite-plugin-vue-server-ref',
    resolveId(id) {
      const idx = VIRTUAL_PREFIX.findIndex(pre => id.startsWith(pre))
      if (idx > -1)
        return URL_PREFIX[idx] + id.slice(VIRTUAL_PREFIX[idx].length)
      return URL_PREFIX.some(pre => id.startsWith(pre))
        ? id
        : null
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || req.method !== 'POST')
          return next()

        const id = parseId(req.url)
        if (!id)
          return next()

        const key = id.key
        const payload = await getBodyJson(req)

        for (const id of idMaps[key] || []) {
          const module = server.moduleGraph.getModuleById(id)
          if (module)
            server.moduleGraph.invalidateModule(module)
        }

        if (payload.patch)
          set(state, key, apply(get(state, key), payload.patch))
        else
          set(state, key, payload.data)

        server.ws.send({
          type: 'custom',
          event: WS_EVENT,
          data: { ...payload, key },
        })

        options.onChanged?.(key, get(state, key), payload.patch, payload.timestamp)

        res.write('')
        res.end()
      })
    },
    async load(id) {
      const res = parseId(id)
      if (!res)
        return

      if (!idMaps[res.key])
        idMaps[res.key] = new Set()
      idMaps[res.key]!.add(id)

      return genCode(
        resolved,
        res,
        toAtFS(await resolvePath('vite-plugin-vue-server-ref/client', { url: import.meta.url })),
      )
    },
  }
}

function toAtFS(path: string) {
  return `/@fs${ensurePrefix('/', slash(path))}`
}
