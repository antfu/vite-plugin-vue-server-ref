# vite-plugin-vue-server-ref

[![NPM version](https://img.shields.io/npm/v/vite-plugin-vue-server-ref?color=a1b858&label=)](https://www.npmjs.com/package/vite-plugin-vue-server-ref)

Share state between clients and Vite server.

## Install

```bash
npm i -D vite-plugin-vue-server-ref
```

Add plugin to your `vite.config.ts`:

```ts
// vite.config.ts
import ServerRef from 'vite-plugin-vue-server-ref'

export default {
  plugins: [
    ServerRef()
  ]
}
```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2021 [Anthony Fu](https://github.com/antfu)
