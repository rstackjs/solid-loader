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

Add `solid-loader` after `builtin:swc-loader` in the `use` array for JSX and TSX files. Rspack runs loaders from right to left, so Solid compiles the JSX first and SWC then strips TypeScript types.

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
        test: /\.[mc]?[jt]sx$/i,
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

The loader uses Solid’s native compiler by default (`'native'`). Set `compiler` to `'babel'` to compile JSX with `@solidjs/babel-plugin`.

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

By default, Solid Refresh runs in development when HMR is enabled, the target supports the DOM, and the compiler is generating client output. Set `refresh` to `true` or `false` to override that behavior. For example, disable it on the main loader when using the [separate pre-loader](#using-a-separate-pre-loader).

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

Pass options to the selected Solid compiler through `solid`. It generates DOM output by default and enables development transforms in Rspack’s development mode. For a server build that renders HTML for hydration, use the following settings.

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

By default, the loader processes every file matched by the Rspack rule. If the rule also handles plain TypeScript, use `scriptRegex` to compile only TSX files and pass the rest through to the next loader.

```ts
export default {
  module: {
    rules: [
      {
        test: /\.tsx?$/i,
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
              scriptRegex: /\.tsx$/i,
            },
          },
        ],
      },
    ],
  },
};
```

### transformFilename

The loader normally uses the resource path to match `scriptRegex` and choose a parser. Give an inline module a filename such as `'data-uri.jsx'` to parse it as JSX. Source maps still point to the original resource.

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

The `solid-loader/refresh` pre-loader tracks changes per component by default so edits can preserve state in unaffected components. Set `granular` to `false` on the pre-loader to turn off this tracking while keeping HMR enabled.

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
