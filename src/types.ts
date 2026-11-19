import type { TransformOptions } from '@solidjs/compiler';

export type SolidCompiler = 'babel' | 'native';

/** Options passed to the Solid JSX compiler. Rspack supplies the filename and source map settings. */
export type SolidPresetOptions = Omit<
  TransformOptions,
  'filename' | 'sourceMap' | 'effectWrapper' | 'memoWrapper'
> & {
  /** Babel also accepts a custom runtime helper name. Defaults to `'effect'`. */
  effectWrapper?: string | false;
  /** Babel also accepts a custom runtime helper name. Defaults to `'memo'`. */
  memoWrapper?: string | false;
};
