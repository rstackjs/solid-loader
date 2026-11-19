import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { rspack } from '@rspack/core';
import { expect, test } from '@rstest/playwright';

test('preserves loader data when both Solid loaders skip a file', async () => {
  const playground = path.resolve(import.meta.dirname, '../../playground');
  const cwd = await mkdtemp(path.join(playground, 'test-temp-'));
  try {
    await mkdir(path.join(cwd, 'node_modules'));
    await writeFile(
      path.join(cwd, 'node_modules/entry.js'),
      'export default 0;',
    );
    await writeFile(
      path.join(cwd, 'send.cjs'),
      `module.exports = function (source, map) {
        this.callback(null, source, map, { value: 'from upstream' });
      };`,
    );
    await writeFile(
      path.join(cwd, 'receive.cjs'),
      `module.exports = function (source, map, data) {
        if (data?.value !== 'from upstream') throw new Error('Missing loader data');
        return source;
      };`,
    );

    const stats = await promisify(rspack)({
      context: cwd,
      entry: './node_modules/entry.js',
      mode: 'development',
      target: 'node',
      output: { path: cwd },
      module: {
        rules: [
          {
            test: /entry\.js$/,
            use: [
              path.join(cwd, 'receive.cjs'),
              { loader: 'solid-loader', options: { scriptRegex: /\.jsx$/ } },
              'solid-loader/refresh',
              path.join(cwd, 'send.cjs'),
            ],
          },
        ],
      },
    });
    expect(stats?.toJson({ all: false, errors: true }).errors).toEqual([]);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
