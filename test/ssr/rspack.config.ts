import type { Configuration } from '@rspack/core';
import type { SolidCompiler } from 'solid-loader';

export default ({
  compiler = 'native',
}: { compiler?: SolidCompiler } = {}): Configuration => ({
  context: import.meta.dirname,
  mode: 'production',
  target: 'node',
  entry: './src/app.tsx',
  devtool: 'source-map',
  output: {
    filename: 'app.cjs',
    library: { type: 'commonjs2' },
  },
  resolve: { conditionNames: ['solid', '...'] },
  module: {
    rules: [
      {
        test: /\.tsx$/,
        use: [
          { loader: 'builtin:swc-loader', options: { detectSyntax: 'auto' } },
          {
            loader: 'solid-loader',
            options: { compiler, solid: { generate: 'ssr' } },
          },
        ],
      },
    ],
  },
});
