import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/client.ts',
    'src/index.ts',
  ],
  declaration: true,
  rollup: {
    emitCJS: true,
  },
})
