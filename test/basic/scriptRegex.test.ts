import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { rspack } from '@rspack/core';
import { expect, test } from '@rstest/playwright';

test('compiles consecutive JSX files with a global scriptRegex', async () => {
  const playground = path.resolve(import.meta.dirname, '../../playground');
  const cwd = await mkdtemp(path.join(playground, 'test-temp-'));
  try {
    await writeFile(
      path.join(cwd, 'app.jsx'),
      "import './view.jsx'; export default <main />;",
    );
    await writeFile(path.join(cwd, 'view.jsx'), 'export default <p />;');

    const stats = await promisify(rspack)({
      context: cwd,
      mode: 'development',
      entry: './app.jsx',
      output: { path: cwd },
      module: {
        rules: [
          {
            test: /\.jsx$/,
            loader: 'solid-loader',
            options: { scriptRegex: /\.jsx$/g },
          },
        ],
      },
    });
    expect(stats?.toJson({ all: false, errors: true }).errors).toEqual([]);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
