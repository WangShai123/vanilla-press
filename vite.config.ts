import { defineConfig } from 'vite-plus'
import type { OxfmtConfig } from 'vite-plus/fmt'

import fmtConfig from './.oxfmtrc.json' with { type: 'json' }

export default defineConfig({
  lint: {
    ignorePatterns: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'output/**',
      'packages/*/dist/**',
      'packages/create-vanilla-press/template/**',
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      'no-console': ['error', { allow: ['error', 'warn'] }],
    },
  },

  fmt: fmtConfig as OxfmtConfig,
})
