#!/usr/bin/env node

import process from 'process';

import { runScaffoldCli } from '../src/scaffold.js';

runScaffoldCli(process.argv.slice(2), {
  commandName: 'create-vanilla-press',
}).catch((error) => {
  console.error(`\nFailed to scaffold project: ${error.message}`);
  process.exitCode = 1;
});
