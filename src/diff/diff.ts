// Ported from https://gist.github.com/developit/998926ad50b5743ac5a108dfde2fbeb2 by @developit

/**
 * Use this to create a "patch" object in the worker thread.
 * patch = diff(newObject, oldObject);
 */
export function diff(obj: any, old: any) {
  if (typeof obj === 'object') {
    const isArray = Array.isArray(obj)

    if (!old || typeof old !== 'object' || (isArray !== Array.isArray(old)))
      return obj

    if (isArray) {
      let out
      let i = 0
      const max = Math.min(obj.length, old.length)
      for (; i < max; i++) {
        const differs = different(obj[i], old[i])
        if (differs)
          break
      }
      // for previously-empty arrays, hint at newness by using an Array
      const useArray = old.length === 0
      const offset = obj.length - old.length
      for (let j = obj.length; j-- > i;) {
        const oldJ = j - offset
        if (oldJ >= 0) {
          const differs = different(obj[j], old[oldJ])
          if (differs) {
            if (!out)
              out = useArray ? [] : {}
            // @ts-expect-error casting
            out[j] = diff(obj[j], old[oldJ])
          }
        }
        else {
          if (!out)
            out = useArray ? [] : {}
          // @ts-expect-error casting
          out[j] = obj[j]
        }
      }
      return out
    }

    let out
    for (const key in obj) {
      if (!(key in old) || obj[key] !== old[key]) {
        if (!out)
          out = {}
        // `undefined` means removed, missing means unchanged.
        const r = diff(obj[key], old[key])
        if (r !== undefined)
          // @ts-expect-error casting
          out[key] = r
      }
    }
    for (const key in old) {
      if (obj == null || !(key in obj)) {
        if (!out)
          out = {}
        // `undefined` means removed, missing means unchanged.
        // @ts-expect-error casting
        out[key] = undefined
      }
    }
    return out
  }
  else if (obj !== old) {
    return obj
  }
}

function different(obj: any, old: any) {
  for (const key in obj) {
    if (old == null || !(key in old) || obj[key] !== old[key])
      return true
  }
  for (const key in old) {
    if (obj == null || !(key in obj))
      return true
  }
  return false
}
