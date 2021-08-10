import { stringify, parse } from '../src/client'

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
