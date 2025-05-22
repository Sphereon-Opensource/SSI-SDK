// tsup.config.ts
// import * as path from 'node:path'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  tsconfig: '../../tsconfig.tsup.json',
  dts: true,
  target: ['es2022'],
  platform: 'neutral',
  cjsInterop: false,
  experimentalDts: false,
  // onSuccess: "tsc -p ../../../../tsconfig.build.json --emitDeclarationOnly",
  shims: true,
  sourcemap: true,
  splitting: false,
  outDir: 'dist',
  clean: true,
  skipNodeModulesBundle: true,
  noExternal: [
    "@veramo/data-store",
  ]
  /*external: [
    'module',
    'fs',
    'crypto',
    'path',
    'assert',
    'stream',
    'events',
    'dns',
    'tls',
    'net',
    'url',
    'node:url',
    'node:fs',
    'node:path',
    'node:fs/promises',
    'os',
    'node:events',
    'node:stream',
    'node:string_decoder',
    'whatwg-url',
    'whatwg-fetch'
  ],*/
})
