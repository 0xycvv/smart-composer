#!/usr/bin/env node
const { build, cliopts } = require('estrella');
const Path = require('path');

const [opts, args] = cliopts.parse([
  'p, prepare',
  'prepare for publish',
]);

const common = {
  entry: 'src/main.ts',
  bundle: true,
};

if (cliopts.watch) {
  build({
    ...common,
    // bundle: true,
    outfile: 'dist/main.js',
    sourcemap: true,
    format: 'iife',
    globalName: 'SmartComposer',
  });
  require('serve-http').createServer({
    port: 8181,
    indexFilename: 'index.html',
  });
}

if (opts.prepare) {
  build({
    ...common,
    outfile: 'dist/main.js',
    minify: true,
    format: 'iife',
    globalName: 'SmartComposer',
  });

  build({
    ...common,
    outfile: 'dist/main.cjs.js',
    minify: true,
    format: 'cjs',
    globalName: 'SmartComposer',
  });

  build({
    ...common,
    outfile: 'dist/main.esm.js',
    minify: true,
    format: 'esm',
    globalName: 'SmartComposer',
  });
}
