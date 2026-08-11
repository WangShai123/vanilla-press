import type { RobotsConfig } from '../src/types.ts';

export default {
  rules: [
    {
      userAgent: '*',
      allow: ['/'],
      disallow: [],
    },
  ],
} satisfies RobotsConfig;
