#!/usr/bin/env node
const { build, cliopts } = require('estrella');
const Path = require('path');

build({
  entry: 'src/main.ts',
  outfile: 'dist/main.js',
  bundle: true,
  sourcemap: true,
  minify: true,
  format: 'iife',
  globalName: 'SmartComposer',
});

cliopts.watch &&
  require('serve-http').createServer({
    port: 8181,
    indexFilename: 'example.html'
  });
