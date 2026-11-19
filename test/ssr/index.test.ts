import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { expect } from '@rstest/playwright';
import { build, test } from '../helpers';
import createConfig from './rspack.config';

for (const compiler of ['native', 'babel'] as const) {
  test(`renders typed SSR output with ${compiler}`, async ({ tempDir }) => {
    const config = createConfig({ compiler });
    await build({ ...config, output: { ...config.output, path: tempDir } });

    const { html } = createRequire(import.meta.url)(
      path.join(tempDir, 'app.cjs'),
    );
    expect(html).toBe('<h1>Hello</h1>');
    const map = JSON.parse(
      await readFile(path.join(tempDir, 'app.cjs.map'), 'utf8'),
    );
    expect(map.sources).toContainEqual(expect.stringMatching(/app\.tsx$/));
  });
}
