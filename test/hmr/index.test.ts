import { cp } from 'node:fs/promises';
import path from 'node:path';
import { rspack } from '@rspack/core';
import { RspackDevServer } from '@rspack/dev-server';
import { editFile, getRandomPort } from '@rstackjs/test-utils';
import { expect } from '@rstest/playwright';
import { test } from '../helpers';
import createConfig from './rspack.config';

for (const refresh of ['automatic', 'explicit Babel', 'pre-loader'] as const) {
  test(`preserves parent state during HMR with ${refresh} refresh`, async ({
    page,
    tempDir,
  }) => {
    const src = path.join(tempDir, 'src');
    await cp(path.join(import.meta.dirname, 'src'), src, { recursive: true });
    const port = await getRandomPort();
    const compiler = rspack({ ...createConfig({ refresh }), context: tempDir });
    const server = new RspackDevServer(
      { host: '127.0.0.1', port, hot: true },
      compiler,
    );
    try {
      await server.start();
      await page.goto(`http://127.0.0.1:${port}`);
      const button = page.getByRole('button');
      await button.click();
      await expect(button).toHaveText('Count: 1');
      await editFile(path.join(src, 'Counter.tsx'), (code) =>
        code.replace('Count:', 'Updated:'),
      );
      await expect(button).toHaveText('Updated: 1');
    } finally {
      await server.stop();
    }
  });
}
