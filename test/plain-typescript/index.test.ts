import { build, test } from '../helpers';
import config from './rspack.config';

test('builds a TSX component that imports a plain TypeScript module', async ({
  tempDir,
}) => {
  await build({ ...config, output: { path: tempDir } });
});
