# solid-loader

A Rspack 2 loader for Solid 2 JSX and TSX. It uses Solid’s native compiler by default and supports hot module replacement (HMR) with Solid Refresh.

<p>
  <a href="https://www.npmjs.com/package/solid-loader"><img src="https://img.shields.io/npm/v/solid-loader?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="MIT license" /></a>
  <a href="https://npmcharts.com/compare/solid-loader?minimal=true"><img src="https://img.shields.io/npm/dm/solid-loader.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="monthly npm downloads" /></a>
</p>

## Usage

Install the Solid runtime and add the loader as a development dependency.

```sh
pnpm add solid-js@2 @solidjs/web@2
pnpm add -D solid-loader
```

Add `solid-loader` to the JSX and TSX rule in `rspack.config.ts`. If your project already has an SWC rule for these files, add the loader to its `use` array as shown below.

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
          { loader: 'builtin:swc-loader', options: { detectSyntax: 'auto' } },
          'solid-loader',
        ],
      },
    ],
  },
});
```

Rspack runs loaders from right to left. In this rule, Solid compiles the JSX first. SWC then strips TypeScript types and transforms the remaining JavaScript for your target.

For TypeScript projects, set `jsx` to `"preserve"` and `jsxImportSource` to `"@solidjs/web"` in `tsconfig.json`.

## Solid Refresh

For browser development builds, enable HMR in Rspack, add `'development'` to `resolve.conditionNames` alongside `'solid'`, and set `refresh: true` on the main loader.

```ts
const jsxRule = {
  test: /\.[mc]?[jt]sx$/i,
  use: [
    { loader: 'builtin:swc-loader', options: { detectSyntax: 'auto' } },
    { loader: 'solid-loader', options: { refresh: true } },
  ],
};
```

The [playground](./playground/rspack.config.ts) enables this option only in development.

### Using a separate pre-loader

If another loader needs to run between Solid Refresh and JSX compilation, use `solid-loader/refresh` as a pre-loader and leave the main loader’s `refresh` option at its default. For example, this lets Refresh register components before a custom Babel transform runs.

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

## Server-side rendering

If the client will hydrate server-rendered HTML, enable `hydratable` in both builds. Set `solid.generate` to match the output each build needs.

| Build                        | Compiler options                        |
| ---------------------------- | --------------------------------------- |
| Server                       | `{ generate: 'ssr', hydratable: true }` |
| Client hydrating server HTML | `{ generate: 'dom', hydratable: true }` |

Add this rule so the Solid runtime can load hydration modules by URL.

```js
{
  descriptionData: { name: /^@solidjs\/web$/ },
  parser: { importDynamic: false },
}
```

## Options

Pass options to the loader in the rule’s `use` array. This example selects the Babel backend.

```ts
const jsxRule = {
  test: /\.[mc]?[jt]sx$/i,
  use: [
    { loader: 'builtin:swc-loader', options: { detectSyntax: 'auto' } },
    { loader: 'solid-loader', options: { compiler: 'babel' } },
  ],
};
```

For typed configurations, import `SolidLoaderOptions`, `SolidCompiler`, or `SolidPresetOptions` from `solid-loader`, and `SolidRefreshLoaderOptions` from `solid-loader/refresh`.

### compiler

- **Type:** `'native' | 'babel'`
- **Default:** `'native'`

Selects the Solid JSX compiler. The default uses `@solidjs/compiler`. Set this to `'babel'` to compile with `@solidjs/babel-plugin`.

### refresh

- **Type:** `boolean`
- **Default:** `false`

Runs Solid Refresh before the main loader compiles JSX with either compiler. Enable it for browser builds that use HMR. Files in `node_modules` skip the Refresh transform and still go through JSX compilation.

### solid

- **Type:** `SolidPresetOptions`

Passes options to the selected compiler. By default, Solid generates DOM output and enables development transforms when Rspack runs in development mode. Set `solid.dev` to override that behavior, or use `solid.generate` and `solid.hydratable` to configure [server-side rendering](#server-side-rendering).

### decoratorVersion

- **Type:** `'legacy' | '2022-03' | '2023-11'`

Controls how the Babel backend parses decorators. Set this to `'legacy'` if your source uses legacy decorator syntax. Both dated values select Babel’s standard decorators parser, which is also the default when you omit this option.

### scriptRegex

- **Type:** `RegExp`

Filters the files the loader compiles. For example, if a shared rule handles both `.ts` and `.tsx`, use `scriptRegex: /\.tsx$/i` to pass plain TypeScript through to the next loader. By default, the loader processes every file that matches the Rspack rule.

### transformFilename

- **Type:** `string`
- **Default:** The resource path supplied by Rspack.

Sets the filename used for the `scriptRegex` check and for choosing the JSX or TSX parser. For example, use `transformFilename: 'data-uri.jsx'` for a rule that handles inline JSX modules. Source maps still point to the original resource.

### granular

- **Loader:** `solid-loader/refresh`
- **Type:** `boolean`
- **Default:** `true`

Adds per-component metadata so Solid Refresh can limit which components remount after an edit. Set `granular: false` on the refresh loader to disable that tracking while keeping HMR enabled.

## License

[MIT](./LICENSE).
