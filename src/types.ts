import type { TransformOptions } from '@solidjs/compiler';

export type SolidCompiler = 'babel' | 'native';

/** Options passed to the Solid JSX compiler. Rspack supplies the filename and source map settings. */
export type SolidPresetOptions = Omit<
  TransformOptions,
  'filename' | 'sourceMap'
>;
