import { createRequire } from 'node:module';
import type { TransformOptions } from '@babel/core';
import type { LoaderDefinition } from '@rspack/core';
import {
  applyRefresh,
  getTransformFilename,
  mergeSourceMaps,
  NODE_MODULES_REGEX,
  normalizeSourceMap,
} from './helpers.js';
import type { SolidCompiler, SolidPresetOptions } from './types.js';

export type { SolidCompiler, SolidPresetOptions } from './types.js';

const require = createRequire(import.meta.url);
const TSX_REGEX = /\.tsx$/i;

export type SolidLoaderOptions = {
  compiler?: SolidCompiler;
  refresh?: boolean;
  solid?: SolidPresetOptions;
  scriptRegex?: RegExp;
  decoratorVersion?: 'legacy' | '2022-03' | '2023-11';
  transformFilename?: string;
};

const solidLoader: LoaderDefinition<SolidLoaderOptions> = async function (
  source,
  sourceMap,
  additionalData,
): Promise<void> {
  const callback = this.async();
  const options = this.getOptions();
  const sourceFilename = this.resourcePath;
  const resourceFilename = options.transformFilename ?? sourceFilename;

  if (
    options.scriptRegex &&
    resourceFilename.search(options.scriptRegex) === -1
  ) {
    callback(null, source, sourceMap, additionalData);
    return;
  }

  const filename = getTransformFilename(resourceFilename);
  const { compiler = 'native', decoratorVersion } = options;
  const solid = { dev: this.mode === 'development', ...options.solid };
  const refresh =
    options.refresh ??
    (this.mode === 'development' &&
      this.hot &&
      this.environment.document &&
      solid.generate !== 'ssr');

  try {
    if (refresh && !NODE_MODULES_REGEX.test(sourceFilename)) {
      const result = await applyRefresh(source, sourceMap, this, {
        filename: resourceFilename,
      });
      source = result.code;
      sourceMap = result.map;
    }
    const inputSourceMap = normalizeSourceMap(sourceMap);

    if (compiler === 'babel') {
      const { transformAsync } = await import('@babel/core');
      const parserPlugins: NonNullable<
        NonNullable<TransformOptions['parserOpts']>['plugins']
      > = [decoratorVersion === 'legacy' ? 'decorators-legacy' : 'decorators'];

      parserPlugins.push('jsx');

      if (TSX_REGEX.test(filename)) {
        parserPlugins.push('typescript');
      }

      const result = await transformAsync(source, {
        filename,
        sourceFileName: sourceFilename,
        sourceMaps: this.sourceMap || Boolean(sourceMap),
        inputSourceMap,
        ast: false,
        babelrc: false,
        configFile: false,
        parserOpts: {
          plugins: parserPlugins,
        },
        plugins: [[require.resolve('@solidjs/babel-plugin'), solid]],
      });

      callback(null, result?.code ?? source, result?.map ?? inputSourceMap);
      return;
    }

    const { transformAsync } = await import('@solidjs/compiler');
    const result = await transformAsync(source, {
      ...solid,
      filename,
      sourceMap: this.sourceMap || Boolean(sourceMap),
    });

    callback(
      null,
      result.code,
      mergeSourceMaps(inputSourceMap, result.map, sourceFilename),
    );
  } catch (error) {
    callback(error instanceof Error ? error : new Error(String(error)));
  }
};

export default solidLoader;
