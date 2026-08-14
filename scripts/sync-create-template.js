import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const packageRoot = path.join(repoRoot, 'packages', 'create-vanilla-press');
const templateRoot = path.join(packageRoot, 'template');
const starterReadme = `# vanilla-press

## Install

\`\`\`sh
npm install
\`\`\`

## Development

\`\`\`sh
npm run dev
\`\`\`

## Build

\`\`\`sh
npm run build
\`\`\`

## Structure

- \`docs/\`: Markdown documentation pages.
- \`assets/\`: static assets copied to \`dist/public/\`, including \`favicon.ico\`.
- \`vp/config/\`: site, locale, menu, sidebar, robots, LLMs, and footer script config.
- \`vp/layouts/\`: project layouts that override or extend built-in layouts.
- \`vp/components/\`: project Markdown/runtime components.
- \`dist/\`: generated static site output.
`;

async function copy(source, target) {
  await fs.cp(source, target, {
    recursive: true,
    filter: (file) => !file.endsWith(`${path.sep}.DS_Store`),
  });
}

await fs.rm(templateRoot, { force: true, recursive: true });
await fs.mkdir(templateRoot, { recursive: true });
await copy(path.join(repoRoot, 'assets'), path.join(templateRoot, 'assets'));
await copy(path.join(repoRoot, 'docs'), path.join(templateRoot, 'docs'));
await copy(path.join(repoRoot, 'vp'), path.join(templateRoot, 'vp'));
await fs.writeFile(path.join(templateRoot, 'README.md'), starterReadme, 'utf8');
