import { describe, expect, it } from 'vitest'
import { genCode } from '../src/generate'
import { resolveOptions } from '../src/options'
import { parseId } from '../src/utils'

describe('generate', () => {
  const options = resolveOptions({})
  it('ref', async () => {
    const id = parseId('server-ref:foo')!
    await expect(genCode(options, id)).toMatchFileSnapshot('output/generate-ref-foo.js')
  })

  it('deep ref', async () => {
    const id = parseId('server-ref:foo/bar')!
    await expect(genCode(options, id)).toMatchFileSnapshot('output/generate-ref-foo-bar.js')
  })

  it('reactive', async () => {
    const id = parseId('server-reactive:foo')!
    await expect(genCode(options, id)).toMatchFileSnapshot('output/generate-reactive-foo.js')
  })

  it('reactive diffed', async () => {
    const id = parseId('server-reactive:foo?diff')!
    await expect(genCode(options, id)).toMatchFileSnapshot('output/generate-reactive-diff.js')
  })
})
