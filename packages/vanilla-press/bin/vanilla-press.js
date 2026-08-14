#!/usr/bin/env node

import { spawn } from 'child_process';
import { createRequire } from 'module';
import path from 'path';
import process from 'process';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const currentFile = fileURLToPath(import.meta.url);
const require = createRequire(import.meta.url);

async function loadBuild() {
  const distEntry = path.join(packageRoot, 'dist', 'build.js');
  try {
    return await import(pathToFileURL(distEntry).href);
  } catch {
    return import(
      pathToFileURL(path.join(packageRoot, 'src', 'build.ts')).href
    );
  }
}

function printHelp() {
  process.stdout.write(`Usage:
  vanilla-press build [inputDir] [outputDir]
  vanilla-press dev [inputDir] [outputDir]\n`);
}

function quoteArg(value) {
  return JSON.stringify(value);
}

function runDev(args) {
  const inputDir = args[0] || 'docs';
  const outputDir = args[1] || 'dist';
  const nodemonBin = require.resolve('nodemon/bin/nodemon.js');
  const command = [process.execPath, currentFile, 'build', ...args]
    .map(quoteArg)
    .join(' ');
  const child = spawn(
    process.execPath,
    [
      nodemonBin,
      '--watch',
      inputDir,
      '--watch',
      'vp',
      '--ext',
      'ts,js,md,css',
      '--ignore',
      outputDir,
      '--exec',
      command,
    ],
    { stdio: 'inherit' }
  );

  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exitCode = code || 0;
  });
}

async function runBuild(args) {
  const { build } = await loadBuild();
  await build({
    inputDir: args[0],
    outputDir: args[1],
  });
}

async function main(args) {
  const command = args[0] || 'build';
  const rest = args.slice(1);

  if (command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'build') {
    await runBuild(rest);
    return;
  }

  if (command === 'dev') {
    runDev(rest);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main(process.argv.slice(2)).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
