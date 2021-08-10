import { genCode } from '../src/generate'
import { resolveOptions } from '../src/options'
import { parseId } from '../src/utils'

describe('generate', () => {
  const options = resolveOptions({})
  it('ref', () => {
    const id = parseId('server-ref:foo')!
    expect(genCode(options, id)).toMatchSnapshot()
  })

  it('deep ref', () => {
    const id = parseId('server-ref:foo/bar')!
    expect(genCode(options, id)).toMatchSnapshot()
  })

  it('reactive', () => {
    const id = parseId('server-reactive:foo')!
    expect(genCode(options, id)).toMatchSnapshot()
  })

  it('reactive deferred', () => {
    const id = parseId('server-reactive:foo?defer')!
    expect(genCode(options, id)).toMatchSnapshot()
  })
})
