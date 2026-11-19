import {
  type Configuration,
  HtmlRspackPlugin,
  type RuleSetRule,
} from '@rspack/core';

type Refresh = 'automatic' | 'explicit Babel' | 'pre-loader';

export default ({
  refresh = 'automatic',
}: { refresh?: Refresh } = {}): Configuration => {
  const test = /\.[mc]?[jt]sx$/i;
  const rules: RuleSetRule[] = [];
  if (refresh === 'pre-loader') {
    rules.push({ test, enforce: 'pre', loader: 'solid-loader/refresh' });
  }

  rules.push(
    {
      test,
      use: [
        { loader: 'builtin:swc-loader', options: { detectSyntax: 'auto' } },
        refresh === 'automatic'
          ? 'solid-loader'
          : {
              loader: 'solid-loader',
              options: {
                compiler: 'babel',
                refresh: refresh === 'explicit Babel',
              },
            },
      ],
    },
    {
      descriptionData: { name: /^@solidjs\/web$/ },
      parser: { importDynamic: false },
    },
  );

  return {
    context: import.meta.dirname,
    mode: 'development',
    entry: './src/index.tsx',
    resolve: {
      extensions: ['.tsx', '...'],
      conditionNames: ['solid', 'development', '...'],
    },
    module: { rules },
    plugins: [new HtmlRspackPlugin()],
  };
};
