/* eslint-disable no-restricted-syntax */
/**
 * Use this to apply diffs on the main thread.
 * newObject = apply(oldObject, patch);
 */
export function apply(obj: any, diff: any) {
  if (typeof obj !== typeof diff)
    return diff

  if (typeof diff === 'object') {
    if (Array.isArray(diff))
      return diff

    let out
    if (Array.isArray(obj)) {
      out = obj
      for (const i in diff)
        // @ts-expect-error
        out[i] = apply(obj[i], diff[i])
    }
    else {
      out = obj
      for (const i in diff)
        out[i] = apply(obj[i], diff[i])
    }

    return out
  }
  return diff
}
