import { describe, expect, it } from 'vitest'
import { parse, stringify } from '../src/client'

describe('should', () => {
  it('exported', () => {
    const obj = {
      foo: 1,
      boo: undefined,
      deep: {
        nested: {
          a: [undefined],
        },
      },
    }

    expect(parse(stringify(obj))).toEqual(obj)
  })
})
