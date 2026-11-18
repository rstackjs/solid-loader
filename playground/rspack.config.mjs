import { HtmlRspackPlugin } from '@rspack/core';

export default (_env, { mode }) => {
  const dev = mode === 'development';
  const test = /\.[mc]?[jt]sx$/i;

  return {
    context: import.meta.dirname,
    mode,
    entry: './src/index.tsx',
    resolve: {
      extensions: ['.tsx', '.jsx', '...'],
      conditionNames: ['solid', ...(dev ? ['development'] : []), '...'],
    },
    module: {
      rules: [
        {
          test,
          use: [
            { loader: 'builtin:swc-loader', options: { detectSyntax: 'auto' } },
            'solid-loader',
          ],
        },
        ...(dev
          ? [
              {
                test,
                enforce: 'pre',
                exclude: /node_modules/,
                dependency: { not: 'url' },
                resourceQuery: { not: /[?&]raw(?:&|=|$)/ },
                with: { type: { not: 'text' } },
                loader: 'solid-loader/refresh',
              },
            ]
          : []),
        {
          descriptionData: { name: /^@solidjs\/web$/ },
          parser: { importDynamic: false },
        },
      ],
    },
    plugins: [new HtmlRspackPlugin()],
  };
};
