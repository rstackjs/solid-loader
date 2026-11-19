import type { Configuration } from '@rspack/core';

export default {
  context: import.meta.dirname,
  mode: 'production',
  entry: './src/index.tsx',
  resolve: { conditionNames: ['solid', '...'] },
  module: {
    rules: [
      {
        test: /\.[mc]?[jt]sx?$/i,
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
} satisfies Configuration;
