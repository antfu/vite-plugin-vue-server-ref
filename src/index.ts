import type { Plugin } from 'vite'
import { ServerRefOptions } from './types'
import { getBodyJson } from './utils'

export * from './types'

const URL_PREFIX = '/@server-ref/'
const VIRTUAL_PREFIX = 'server-ref:'
const WS_EVENT = 'server-ref'

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
      if (id.startsWith(VIRTUAL_PREFIX))
        return URL_PREFIX + id.slice(VIRTUAL_PREFIX.length)
      return id.startsWith(URL_PREFIX)
        ? id
        : null
    },
    configureServer(server) {
      server.middlewares.use(async(req, res, next) => {
        if (!req.url?.startsWith(URL_PREFIX) || req.method !== 'POST')
          return next()

        const key = req.url.slice(URL_PREFIX.length)
        const { data, timestamp, patch } = await getBodyJson(req)

        const module = server.moduleGraph.getModuleById(URL_PREFIX + key)
        if (module)
          server.moduleGraph.invalidateModule(module)

        state[key] = data

        server.ws.send({
          type: 'custom',
          event: WS_EVENT,
          data: {
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
      if (!id.startsWith(URL_PREFIX))
        return null

      const key = id.slice(URL_PREFIX.length)
      return `
import { ref, watch } from "${clientVue}"

const data = ref(${JSON.stringify(state[key] ?? defaultValue(key))})

data.syncUp = true
data.syncDown = true
data.paused = false
data.defer = false

if (import.meta.hot) {
  ${debug ? `console.log("[server-ref] [${key}] ref", data)` : ''}
  ${debug ? `console.log("[server-ref] [${key}] initial", data.value)` : ''}

  let skipNext = false
  let timer = null
  import.meta.hot.on("${WS_EVENT}", (payload) => {
    if (!data.syncDown || data.paused)
      return
    if (payload.key !== "${key}")
      return
    skipNext = true
    data.value = payload.data
    ${debug ? `console.log("[server-ref] [${key}] incoming", payload.data)` : ''}
  })
  watch(data, (v) => {
    if (!data.syncUp || data.paused)
      return
    if (skipNext) {
      skipNext = false
      return
    }
    if (timer)
      clearTimeout(timer)

    timer = setTimeout(()=>{
      ${debug ? `console.log("[server-ref] [${key}] outgoing", data.value)` : ''}
      fetch('${URL_PREFIX + key}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: data.value,
          timestamp: Date.now(),
        })
      })
    }, ${debounce})
  }, { flush: 'sync', deep: true })
}

export default data
`
    },
  }
}
