import { transformRefreshAsync } from '@solidjs/compiler';
import type { LoaderDefinition } from '@rspack/core';
import {
  getTransformFilename,
  mergeSourceMaps,
  normalizeSourceMap,
} from './helpers.js';

const NODE_MODULES_REGEX = /[\\/]node_modules[\\/]/;

export type SolidRefreshLoaderOptions = {
  granular?: boolean;
};

const solidRefreshLoader: LoaderDefinition<SolidRefreshLoaderOptions> =
  async function (source, sourceMap): Promise<void> {
    const callback = this.async();
    const { granular } = this.getOptions();

    if (NODE_MODULES_REGEX.test(this.resourcePath)) {
      callback(null, source, sourceMap);
      return;
    }

    try {
      const result = await transformRefreshAsync(source, {
        filename: getTransformFilename(this.resourcePath),
        bundler: 'standard',
        fixRender: true,
        ...(typeof granular === 'boolean' ? { granular } : {}),
        jsx: false,
        importSource: 'solid-js/refresh',
        sourceMap: this.sourceMap || Boolean(sourceMap),
      });

      callback(
        null,
        result.code,
        mergeSourceMaps(
          normalizeSourceMap(sourceMap),
          result.map,
          this.resourcePath,
        ),
      );
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  };

export default solidRefreshLoader;
