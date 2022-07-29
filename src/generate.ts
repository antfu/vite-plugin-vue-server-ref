import type { ServerRefOptions } from './types'
import { WS_EVENT } from './constant'
import type { ParsedId } from './utils'
import { get } from './utils'

export function genCode(
  options: Required<ServerRefOptions<any>>,
  id: ParsedId,
) {
  const { state, defaultValue, clientVue, debug, debounce } = options
  const { key, type, prefix, diff } = id
  const access = type === 'ref' ? 'data.value' : 'data'

  return `
import { ${type}, watch } from "${clientVue}"
import { randId, stringify, parse, define, apply,${type === 'reactive' ? ' reactiveSet,' : ''}${diff ? ' clone, diff' : ''} } from "vite-plugin-vue-server-ref/client"

const data = ${type}(${JSON.stringify(get(state, key) ?? defaultValue(key))})

let onSet = []
let onPatch = []

define(data, '$syncUp', true)
define(data, '$syncDown', true)
define(data, '$paused', false)
define(data, '$onSet', fn => onSet.push(fn))
define(data, '$onPatch', fn => onPatch.push(fn))

if (import.meta.hot) {
  const id = randId()
  let skipWatch = false
  let timer = null
  ${diff ? 'let copy = null' : ''}

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

  ${diff
    ? `
  function makeClone() {
    copy = clone(${access})
  }

  function getDiff() {
    return diff(${access}, copy)
  }
  `
    : ''}

  function applyPatch(patch, trigger = true) {
    skipWatch = true
    if (trigger) {
      onPatch.forEach(fn => fn(patch))
      ${debug ? `console.log("[server-ref] [${key}] patch incoming", patch)` : ''}
    }
    apply(${access}, patch)
    ${diff ? 'makeClone()' : ''}
    skipWatch = false
  }

  function applySet(newData) {
    skipWatch = true
    onSet.forEach(fn => fn(newData))
    ${type === 'ref' ? 'data.value = payload.data' : 'reactiveSet(data, newData)'}
    ${debug ? `console.log("[server-ref] [${key}] incoming", newData)` : ''}
    ${diff ? 'makeClone()' : ''}
    skipWatch = false
  }
 
  ${debug ? `console.log("[server-ref] [${key}] ref", data)` : ''}
  ${debug ? `console.log("[server-ref] [${key}] initial", ${access})` : ''}
 
  import.meta.hot.on("${WS_EVENT}", (payload) => {
    if (!data.$syncDown || data.$paused || payload.key !== "${key}" || payload.source === id)
      return
    if (payload.patch)
      applyPatch(payload.patch)
    else
      applySet(payload.data)
  })

  define(data, '$patch', async (patch) => {
    if (!data.$syncUp || data.$paused)
      return false
    applyPatch(patch, false)
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
        ${diff ? 'patch: getDiff()' : `data: ${access}`},
        timestamp: Date.now(),
      })
    }, ${debounce})
  }, { flush: 'sync', deep: true })
}
else {
  define(data, '$patch', async () => false)
}

export default data
`.replace(/\n\s*\n/gm, '\n')
}
