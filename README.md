# solid-loader

A Rspack loader for Solid JSX and TSX, with built-in support for Solid Refresh.

Requires Solid 2.0.0 or later and Rspack 2.0.0 or later.

<p>
  <a href="https://www.npmjs.com/package/solid-loader"><img src="https://img.shields.io/npm/v/solid-loader?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="MIT license" /></a>
  <a href="https://npmcharts.com/compare/solid-loader?minimal=true"><img src="https://img.shields.io/npm/dm/solid-loader.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="monthly npm downloads" /></a>
</p>

## Usage

Install the loader as a development dependency with your preferred package manager.

```sh
npm install -D solid-loader
# or
pnpm add -D solid-loader
# or
yarn add -D solid-loader
# or
bun add --dev solid-loader
```

Add `solid-loader` after `builtin:swc-loader` in the `use` array. Rspack runs loaders from right to left, so Solid compiles JSX first and SWC then strips TypeScript types. Plain JavaScript and TypeScript files pass directly to SWC.

```ts
// rspack.config.ts
import { defineConfig } from '@rspack/cli';

export default defineConfig({
  resolve: {
    extensions: ['.tsx', '.jsx', '.ts', '...'],
    conditionNames: ['solid', '...'],
  },
  module: {
    rules: [
      {
        test: /\.[mc]?[jt]sx?$/i,
        exclude: /node_modules/,
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              detectSyntax: 'auto',
            },
          },
          'solid-loader',
        ],
      },
    ],
  },
});
```

In TypeScript projects, set `jsx` to `"preserve"` and `jsxImportSource` to `"@solidjs/web"` in `tsconfig.json`.

## Solid Refresh

Solid Refresh runs automatically during browser development when hot module replacement (HMR) is enabled. Include `'development'` alongside `'solid'` in your development resolve conditions to load Solid’s development runtime. The [playground configuration](./playground/rspack.config.ts) shows how to do this.

### Using a separate pre-loader

If a Babel transform needs to run between Solid Refresh and JSX compilation, set `refresh: false` on the main loader and register `solid-loader/refresh` with `enforce: 'pre'` in your browser development config. See the [pre-loader example](#granular).

## Server-side rendering

Set `solid.generate` to `'ssr'` in the server build. If the client hydrates the server-rendered HTML, enable `solid.hydratable` in both builds and keep the default `'dom'` output on the client.

The [server configuration](#solid) also lets the Solid runtime load hydration modules by URL.

## Options

Set loader options in `module.rules` in your `rspack.config.ts`. The main loader exports the `SolidLoaderOptions` type, and `solid-loader/refresh` exports `SolidRefreshLoaderOptions`.

### compiler

- **Type:** `'native' | 'babel'`
- **Default:** `'native'`

Choose the Solid JSX compiler. Set `compiler` to `'babel'` to use `@solidjs/babel-plugin`.

```ts
export default {
  module: {
    rules: [
      {
        test: /\.jsx$/i,
        loader: 'solid-loader',
        options: {
          compiler: 'babel',
        },
      },
    ],
  },
};
```

### refresh

- **Type:** `boolean`
- **Default:** `true` for client builds in development mode when HMR is enabled and the target supports the DOM, otherwise `false`

Set `refresh` to enable or disable Solid Refresh on the main loader. Set it to `false` when using the [separate pre-loader](#using-a-separate-pre-loader).

```ts
export default {
  module: {
    rules: [
      {
        test: /\.jsx$/i,
        loader: 'solid-loader',
        options: {
          refresh: false,
        },
      },
    ],
  },
};
```

### solid

- **Type:** `SolidPresetOptions`

Pass options to the selected Solid compiler. By default, it generates DOM output, enables development transforms in Rspack’s development mode, and reports source locations relative to Rspack’s `context`. Set `solid.root` to use a different base directory.

For a server build that renders HTML for hydration, use the following settings.

```ts
export default {
  target: 'node',
  module: {
    rules: [
      {
        test: /\.jsx$/i,
        loader: 'solid-loader',
        options: {
          solid: {
            generate: 'ssr',
            hydratable: true,
          },
        },
      },
      {
        descriptionData: {
          name: /^@solidjs\/web$/,
        },
        parser: {
          importDynamic: false,
        },
      },
    ],
  },
};
```

### decoratorVersion

- **Type:** `'legacy' | '2022-03' | '2023-11'`

The Babel backend parses standard decorators by default. Both `'2022-03'` and `'2023-11'` use that parser. Choose `'legacy'` if your code uses legacy decorator syntax.

```ts
export default {
  module: {
    rules: [
      {
        test: /\.jsx$/i,
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'ecmascript',
                  decorators: true,
                },
                transform: {
                  legacyDecorator: true,
                },
              },
            },
          },
          {
            loader: 'solid-loader',
            options: {
              compiler: 'babel',
              decoratorVersion: 'legacy',
            },
          },
        ],
      },
    ],
  },
};
```

### scriptRegex

- **Type:** `RegExp`
- **Default:** `/\.[cm]?[jt]sx$/i`

The main loader compiles files whose names match this pattern. By default it matches JSX and TSX files, including their ESM and CommonJS variants. The following example also enables JSX in JavaScript files.

```ts
export default {
  module: {
    rules: [
      {
        test: /\.[mc]?[jt]sx?$/i,
        exclude: /node_modules/,
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              detectSyntax: 'auto',
            },
          },
          {
            loader: 'solid-loader',
            options: {
              scriptRegex: /\.[cm]?(?:jsx?|tsx)$/i,
            },
          },
        ],
      },
    ],
  },
};
```

### transformFilename

- **Type:** `string`
- **Default:** `this.resourcePath`

Set the filename used to match `scriptRegex` and choose a parser. For example, give an inline module the filename `'data-uri.jsx'` to parse it as JSX. Source maps still point to the original resource.

```ts
export default {
  module: {
    rules: [
      {
        scheme: 'data',
        mimetype: 'text/javascript',
        loader: 'solid-loader',
        options: {
          transformFilename: 'data-uri.jsx',
        },
      },
    ],
  },
};
```

### granular

- **Type:** `boolean`
- **Default:** `true`

The `solid-loader/refresh` pre-loader tracks changes per component so edits can preserve state in unaffected components. Set `granular` to `false` to turn off this tracking while keeping HMR enabled.

```ts
export default {
  module: {
    rules: [
      {
        test: /\.jsx$/i,
        enforce: 'pre',
        loader: 'solid-loader/refresh',
        options: {
          granular: false,
        },
      },
      {
        test: /\.jsx$/i,
        loader: 'solid-loader',
        options: {
          refresh: false,
        },
      },
    ],
  },
};
```

## License

[MIT](./LICENSE).
