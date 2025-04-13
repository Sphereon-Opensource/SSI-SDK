// tsup.config.ts
// import * as path from 'node:path'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  tsconfig: '../../tsconfig.tsup.json',
  dts: true,
  target: ["es2022"],

  experimentalDts: false,
  // onSuccess: "tsc -p ../../../../tsconfig.build.json --emitDeclarationOnly",
  shims: true,
  sourcemap: true,
  splitting: false,
  outDir: 'dist',
  clean: true,
  skipNodeModulesBundle: true,
  // esbuildPlugins: [
  //   esbuildDecorators({tsconfig: '../../tsconfig.base.json', force: true}),
  // ],
})
