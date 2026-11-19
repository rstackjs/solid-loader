import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { type Configuration, rspack } from '@rspack/core';
import { expect, test as base } from '@rstest/playwright';

export const test = base.extend<{ tempDir: string }>({
  tempDir: async ({ task }, use) => {
    const dir = await mkdtemp(
      path.join(path.dirname(task.filepath!), 'test-temp-'),
    );
    try {
      await use(dir);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
});

export async function build(config: Configuration) {
  const stats = await promisify(rspack)(config);
  expect(stats?.toJson({ all: false, errors: true }).errors).toEqual([]);
}
