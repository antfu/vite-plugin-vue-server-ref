import type { Plugin } from 'vite'
import { ServerRefOptions } from './types'
import { VIRTUAL_PREFIX, URL_PREFIX, WS_EVENT } from './constant'
import { get, getBodyJson, parseId, set } from './utils'

export * from './types'

export default function VitePluginServerRef(options: ServerRefOptions<any> = {}): Plugin {
  const {
    state = {},
    debounce = 10,
    debug = false,
    defaultValue = () => undefined,
    clientVue = 'vue',
  } = options

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
      server.middlewares.use(async(req, res, next) => {
        if (!req.url || req.method !== 'POST')
          return next()

        const id = parseId(req.url)
        if (!id)
          return

        const key = id.key
        const { data, timestamp, patch, source } = await getBodyJson(req)

        const module = server.moduleGraph.getModuleById(URL_PREFIX + key)
        if (module)
          server.moduleGraph.invalidateModule(module)

        if (patch)
          set(state, key, Object.assign(get(state, key), patch))
        else
          set(state, key, data)

        server.ws.send({
          type: 'custom',
          event: WS_EVENT,
          data: {
            source,
            key,
            data,
            patch,
            timestamp,
          },
        })

        options.onChanged?.(key, data, patch, timestamp)

        res.write('')
        res.end()
      })
    },
    load(id) {
      const res = parseId(id)
      if (!res)
        return

      const { key, type, prefix } = res
      const access = type === 'ref' ? 'data.value' : 'data'

      return `
import { ${type}, watch } from "${clientVue}"
import { randId, stringify, parse, reactiveSet, define } from "vite-plugin-vue-server-ref/client"

const data = ${type}(${JSON.stringify(get(state, key) ?? defaultValue(key))})

define(data, '$syncUp', true)
define(data, '$syncDown', true)
define(data, '$paused', false)
define(data, '$onSet', () => {})
define(data, '$onPatch', () => {})

if (import.meta.hot) {
  function post(payload) {
    ${debug ? `console.log("[server-ref] [${key}] outgoing", payload)` : ''}
    return fetch('${prefix + key}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: stringify(payload)
    })
  }

  ${debug ? `console.log("[server-ref] [${key}] ref", data)` : ''}
  ${debug ? `console.log("[server-ref] [${key}] initial", ${access})` : ''}

  const id = randId()
  let skipWatch = false
  let timer = null
  import.meta.hot.on("${WS_EVENT}", (payload) => {
    if (!data.$syncDown || data.$paused || payload.key !== "${key}" || payload.source === id)
      return
    skipWatch = true
    if (payload.patch) {
      data.$onPatch(payload.patch)
      Object.assign(${access}, payload.patch)
      ${debug ? `console.log("[server-ref] [${key}] patch incoming", payload.patch)` : ''}
    }
    else {
      data.$onSet(payload.data)
      ${type === 'ref' ? 'data.value = payload.data' : 'reactiveSet(data, payload.data)'}
      ${debug ? `console.log("[server-ref] [${key}] incoming", payload.data)` : ''}
    }
    skipWatch = false
  })

  define(data, '$patch', async (patch) => {
    if (!data.$syncUp || data.$paused)
      return false
    Object.assign(${access}, patch)
    return post({
      source: id,
      patch,
      timestamp: Date.now(),
    })
  })

  watch(data, (v) => {
    if (timer)
      clearTimeout(timer)
    if (!data.$syncUp || data.$paused || skipWatch)
      return

    timer = setTimeout(()=>{
      post({
        source: id,
        data: ${access},
        timestamp: Date.now(),
      })
    }, ${debounce})
  }, { flush: 'sync', deep: true })
}
else {
  define(data, '$patch', async () => false)
}

export default data
`
    },
  }
}
