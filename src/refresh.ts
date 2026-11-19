import type { LoaderDefinition } from '@rspack/core';
import { applyRefresh } from './helpers.js';

export type SolidRefreshLoaderOptions = {
  granular?: boolean;
};

const solidRefreshLoader: LoaderDefinition<SolidRefreshLoaderOptions> =
  async function (source, sourceMap): Promise<void> {
    const callback = this.async();

    try {
      const { granular } = this.getOptions();
      const result = await applyRefresh(source, sourceMap, this, { granular });
      callback(null, result.code, result.map);
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  };

export default solidRefreshLoader;
