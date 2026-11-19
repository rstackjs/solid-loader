import type { LoaderContext, RawSourceMap } from '@rspack/core';
import remapping from '@jridgewell/remapping';

const DEFAULT_SOLID_SCRIPT_REGEX = /\.(?:jsx|tsx)$/i;

// Native transforms infer the parser from a standard JSX/TSX extension.
export const getTransformFilename = (filename: string): string =>
  DEFAULT_SOLID_SCRIPT_REGEX.test(filename)
    ? filename
    : `${filename}${/\.[mc]?tsx$/i.test(filename) ? '.tsx' : '.jsx'}`;

export const normalizeSourceMap = (
  sourceMap: RawSourceMap | string | null | undefined,
): RawSourceMap | undefined =>
  typeof sourceMap === 'string'
    ? (JSON.parse(sourceMap) as RawSourceMap)
    : (sourceMap ?? undefined);

export const mergeSourceMaps = (
  sourceMap: RawSourceMap | undefined,
  generatedMap: string | null | undefined,
  filename: string,
): RawSourceMap | undefined => {
  if (!generatedMap) {
    return sourceMap;
  }

  const parsedMap = JSON.parse(generatedMap) as RawSourceMap;
  parsedMap.sources = [filename];
  if (!sourceMap) {
    return parsedMap;
  }

  return remapping(
    [parsedMap, sourceMap] as Parameters<typeof remapping>[0],
    () => null,
  ) as RawSourceMap;
};

export const NODE_MODULES_REGEX = /[\\/]node_modules[\\/]/;

export async function applyRefresh(
  source: string,
  sourceMap: RawSourceMap | string | undefined,
  context: Pick<LoaderContext, 'resourcePath' | 'sourceMap'>,
  {
    filename = context.resourcePath,
    granular,
  }: { filename?: string; granular?: boolean } = {},
) {
  const { transformRefreshAsync } = await import('@solidjs/compiler');
  const result = await transformRefreshAsync(source, {
    filename: getTransformFilename(filename),
    bundler: 'standard',
    fixRender: true,
    ...(typeof granular === 'boolean' ? { granular } : {}),
    jsx: false,
    importSource: 'solid-js/refresh',
    sourceMap: context.sourceMap || Boolean(sourceMap),
  });

  return {
    code: result.code,
    map: mergeSourceMaps(
      normalizeSourceMap(sourceMap),
      result.map,
      context.resourcePath,
    ),
  };
}
