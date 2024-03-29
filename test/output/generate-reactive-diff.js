
import { reactive, watch } from "vue"
import { randId, stringify, parse, define, apply, reactiveSet, clone, diff } from "vite-plugin-vue-server-ref/client"
const data = reactive(undefined)
let onSet = []
let onPatch = []
define(data, '$syncUp', true)
define(data, '$syncDown', true)
define(data, '$paused', false)
define(data, '$onSet', fn => onSet.push(fn))
define(data, '$onPatch', fn => onPatch.push(fn))
const id = randId()
if (import.meta.hot) {
  let skipWatch = false
  let timer = null
  let copy = null
  function post(payload) {
    return fetch('server-reactive:foo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: stringify(payload)
    })
  }
  function makeClone() {
    copy = clone(data)
  }
  function getDiff() {
    return diff(data, copy)
  }
  function applyPatch(patch, trigger = true) {
    skipWatch = true
    if (trigger) {
      onPatch.forEach(fn => fn(patch))
    }
    apply(data, patch)
    makeClone()
    skipWatch = false
  }
  function applySet(newData) {
    skipWatch = true
    onSet.forEach(fn => fn(newData))
    reactiveSet(data, newData)
    makeClone()
    skipWatch = false
  }
  import.meta.hot.on("vue-server-ref", (payload) => {
    if (!data.$syncDown || data.$paused || payload.key !== "foo" || payload.source === id)
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
        patch: getDiff(),
        timestamp: Date.now(),
      })
    }, 10)
  }, { flush: 'sync', deep: true })
}
else {
  define(data, '$patch', async () => false)
}
export default data
