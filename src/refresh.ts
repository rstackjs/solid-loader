import type { LoaderDefinition } from '@rspack/core';
import { applyRefresh, NODE_MODULES_REGEX } from './helpers.js';

export type SolidRefreshLoaderOptions = {
  granular?: boolean;
};

const solidRefreshLoader: LoaderDefinition<SolidRefreshLoaderOptions> =
  async function (source, sourceMap, additionalData): Promise<void> {
    const callback = this.async();

    if (NODE_MODULES_REGEX.test(this.resourcePath)) {
      callback(null, source, sourceMap, additionalData);
      return;
    }

    try {
      const { granular } = this.getOptions();
      const result = await applyRefresh(source, sourceMap, this, { granular });
      callback(null, result.code, result.map);
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  };

export default solidRefreshLoader;
