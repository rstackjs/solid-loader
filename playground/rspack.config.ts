import { type Configuration, HtmlRspackPlugin } from '@rspack/core';

export default (
  _env: unknown,
  { mode }: Pick<Configuration, 'mode'>,
): Configuration => {
  const dev = mode === 'development';

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
          test: /\.[mc]?[jt]sx$/i,
          use: [
            { loader: 'builtin:swc-loader', options: { detectSyntax: 'auto' } },
            'solid-loader',
          ],
        },
        {
          descriptionData: { name: /^@solidjs\/web$/ },
          parser: { importDynamic: false },
        },
      ],
    },
    plugins: [new HtmlRspackPlugin()],
  };
};
