#!/usr/bin/env node

import path from 'path';
import process from 'process';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');

async function loadModule(name) {
  const distEntry = path.join(packageRoot, 'dist', `${name}.js`);
  const sourceEntry = path.join(packageRoot, 'src', `${name}.ts`);
  const isInstalledPackage = packageRoot
    .split(path.sep)
    .includes('node_modules');

  if (isInstalledPackage) {
    return import(pathToFileURL(distEntry).href);
  }

  try {
    return await import(pathToFileURL(sourceEntry).href);
  } catch {
    return import(pathToFileURL(distEntry).href);
  }
}

function printHelp() {
  process.stdout.write(`Usage:
  vanilla-press build [inputDir] [outputDir]
  vanilla-press dev [inputDir] [outputDir]\n`);
}

async function runBuild(args) {
  const { build } = await loadModule('build');
  await build({
    inputDir: args[0],
    outputDir: args[1],
  });
}

async function runDev(args) {
  const { dev } = await loadModule('dev');
  await dev({
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
    await runDev(rest);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main(process.argv.slice(2)).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
