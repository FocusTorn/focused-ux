import * as esbuild from 'esbuild';
import { pnpPlugin } from '@yarnpkg/esbuild-plugin-pnp';

import process from "node:process"

const isWatch = process.argv.includes('--watch');

const logPlugin = {
  name: 'log-plugin',
  setup(build) {
    let startTime;
    build.onStart(() => {
      startTime = Date.now();
      console.log('Build started...');
    });
    build.onEnd((result) => {
      if (result.errors.length > 0) {
        console.error(`Build failed in ${Date.now() - startTime}ms`, result.errors);
      } else {
        console.log(`✅ Build successful in ${Date.now() - startTime}ms`);
      }
    });
  },
};

const config = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'es2022',
  sourcemap: true,
  logLevel: 'info',
  plugins: [
    pnpPlugin(),
    logPlugin,
  ],
};

async function build() {
  try {
    if (isWatch) {
      const context = await esbuild.context(config);
      await context.watch();
      console.log('👀 Watching for changes in ghost-writer/ext and its dependencies...');
    } else {
      await esbuild.build(config);
    }
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
  }
}

build();