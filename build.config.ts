import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/client.ts',
    'src/index.ts',
  ],
  declaration: 'node16',
  rollup: {
    inlineDependencies: [
      '@antfu/utils',
    ],
  },
})
