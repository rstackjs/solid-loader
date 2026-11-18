# solid-loader

Compile Solid 2 JSX and TSX in Rspack 2. The default loader uses the Solid native compiler. The package also provides a Babel backend and a separate loader for Solid Refresh.

## Usage

Install the loader in a Solid 2 application:

```sh
pnpm add solid-js@2 @solidjs/web@2
pnpm add -D solid-loader
```

Add the loader to the JSX rule in your Rspack config:

```js
// rspack.config.mjs
export default {
  resolve: {
    extensions: ['.tsx', '.jsx', '.ts', '...'],
    conditionNames: ['solid', '...'],
  },
  module: {
    rules: [
      {
        test: /\.[mc]?[jt]sx$/i,
        use: [
          { loader: 'builtin:swc-loader', options: { detectSyntax: 'auto' } },
          'solid-loader',
        ],
      },
    ],
  },
};
```

Rspack runs the loaders from right to left. Solid compiles JSX first, then SWC removes TypeScript types and lowers JavaScript syntax. If you already have an SWC rule for TSX, add `solid-loader` to that rule. For TypeScript projects, set `jsx` to `"preserve"` and `jsxImportSource` to `"@solidjs/web"` in `tsconfig.json`.

## Solid Refresh

For browser development builds with HMR enabled, add `development` to the resolve conditions alongside `solid` and register this extra rule. The pre-loader instruments components before JSX compilation.

```js
{
  test: /\.[mc]?[jt]sx$/i,
  enforce: 'pre',
  exclude: /node_modules/,
  dependency: { not: 'url' },
  resourceQuery: { not: /[?&]raw(?:&|=|$)/ },
  with: { type: { not: 'text' } },
  loader: 'solid-loader/refresh',
}
```

Refresh generates per-component metadata by default. Set `options: { granular: false }` on the refresh rule to disable it. The [playground](./playground/rspack.config.mjs) shows the full configuration for development and production.

## Server-side rendering

Set `options.solid` on the main loader for each build:

| Build                        | Compiler options                        |
| ---------------------------- | --------------------------------------- |
| Server                       | `{ generate: 'ssr', hydratable: true }` |
| Client hydrating server HTML | `{ generate: 'dom', hydratable: true }` |

To let the Solid runtime import hydration modules by URL, add the following rule:

```js
{
  descriptionData: { name: /^@solidjs\/web$/ },
  parser: { importDynamic: false },
}
```

## Loader options

| Option              | Behavior                                                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compiler`          | Defaults to `'native'`. Set to `'babel'` to use `@solidjs/babel-plugin`.                                                                                 |
| `solid`             | Options for the Solid JSX compiler. By default it generates DOM output, with `dev` enabled in Rspack development mode.                                   |
| `decoratorVersion`  | Set to `'legacy'` to parse legacy decorators in the Babel backend. The default parser accepts standard decorators.                                       |
| `scriptRegex`       | Optional filename filter for integrations that share a rule with other script types. By default, the loader compiles every resource matched by the rule. |
| `transformFilename` | Filename to use for filtering and parser selection, e.g. `'data-uri.jsx'` for an inline module. Source maps still refer to the original resource.        |

The main entry exports the `SolidLoaderOptions`, `SolidCompiler`, and `SolidPresetOptions` types. The refresh entry exports `SolidRefreshLoaderOptions`.

## License

[MIT](./LICENSE).
