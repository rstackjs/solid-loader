import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { promisify } from 'node:util';
import { type RuleSetRule, rspack } from '@rspack/core';
import { RspackDevServer } from '@rspack/dev-server';
import { expect, test } from '@rstest/playwright';
import { getRandomPort } from '@rstackjs/test-utils';
import playgroundConfig from '../../playground/rspack.config.ts';

const playground = path.resolve(import.meta.dirname, '../../playground');

test('builds a TSX component that imports a plain TypeScript module', async () => {
  const cwd = await mkdtemp(path.join(playground, 'test-temp-'));
  try {
    await writeFile(
      path.join(cwd, 'count.ts'),
      'export const count: number = 42;',
    );
    await writeFile(
      path.join(cwd, 'app.tsx'),
      `import { render } from '@solidjs/web';
       import { count } from './count.ts';
       render(() => <h1>{count}</h1>, document.body);`,
    );
    const stats = await promisify(rspack)({
      ...playgroundConfig({}, { mode: 'production' }),
      context: cwd,
      entry: './app.tsx',
      output: { path: path.join(cwd, 'dist') },
    });
    expect(stats.toJson({ all: false, errors: true }).errors).toEqual([]);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

for (const compiler of ['native', 'babel']) {
  test(`renders typed SSR output with ${compiler}`, async () => {
    const cwd = await mkdtemp(path.join(playground, 'test-temp-'));
    try {
      await writeFile(
        path.join(cwd, 'app.tsx'),
        `
        import { renderToString } from '@solidjs/web';
        const title: string = 'Hello';
        export const html = renderToString(() => <h1>{title}</h1>);
      `,
      );
      await new Promise<void>((resolve, reject) => {
        rspack(
          {
            context: cwd,
            mode: 'production',
            target: 'node',
            entry: './app.tsx',
            devtool: 'source-map',
            output: {
              path: cwd,
              filename: 'app.cjs',
              library: { type: 'commonjs2' },
            },
            resolve: { conditionNames: ['solid', '...'] },
            module: {
              rules: [
                {
                  test: /\.tsx$/,
                  use: [
                    {
                      loader: 'builtin:swc-loader',
                      options: { detectSyntax: 'auto' },
                    },
                    {
                      loader: 'solid-loader',
                      options: { compiler, solid: { generate: 'ssr' } },
                    },
                  ],
                },
              ],
            },
          },
          (err, stats) => {
            if (err) reject(err);
            else if (stats?.hasErrors())
              reject(new Error(stats.toString({ all: false, errors: true })));
            else resolve();
          },
        );
      });
      const { html } = createRequire(import.meta.url)(
        path.join(cwd, 'app.cjs'),
      );
      expect(html).toBe('<h1>Hello</h1>');
      const map = JSON.parse(
        await readFile(path.join(cwd, 'app.cjs.map'), 'utf8'),
      );
      expect(map.sources).toContainEqual(expect.stringMatching(/app\.tsx$/));
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
}

for (const mode of [
  'automatic refresh',
  'explicit Babel refresh',
  'pre-loader',
]) {
  test(`preserves parent state during HMR with ${mode}`, async ({ page }) => {
    const cwd = await mkdtemp(path.join(playground, 'test-temp-'));
    try {
      await cp(path.join(playground, 'src'), path.join(cwd, 'src'), {
        recursive: true,
      });
      const port = await getRandomPort();
      const config = playgroundConfig({}, { mode: 'development' });
      config.context = cwd;
      if (mode !== 'automatic refresh') {
        const rules = config.module!.rules!;
        const jsxRule = rules[0] as RuleSetRule;
        const standalone = mode === 'pre-loader';
        jsxRule.use = [
          { loader: 'builtin:swc-loader', options: { detectSyntax: 'auto' } },
          {
            loader: 'solid-loader',
            options: { compiler: 'babel', refresh: !standalone },
          },
        ];
        if (standalone) {
          rules.unshift({
            test: /\.[mc]?[jt]sx$/i,
            enforce: 'pre',
            loader: 'solid-loader/refresh',
          });
        }
      }
      const compiler = rspack(config);
      const server = new RspackDevServer(
        { host: '127.0.0.1', port, hot: true },
        compiler,
      );
      await server.start();
      try {
        await page.goto(`http://127.0.0.1:${port}`);
        const button = page.getByRole('button');
        await button.click();
        await expect(button).toHaveText('Count: 1');
        const file = path.join(cwd, 'src/Counter.tsx');
        const source = await readFile(file, 'utf8');
        await writeFile(file, source.replace('Count:', 'Updated:'));
        await expect(button).toHaveText('Updated: 1');
      } finally {
        await server.stop();
      }
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
}
