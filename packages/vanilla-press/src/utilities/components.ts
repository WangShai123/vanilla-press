import path from 'path';
import { pathToFileURL } from 'url';

import { glob } from 'glob';

import type {
  LoadedMarkdownComponent,
  MarkdownComponentDefinition,
} from '../types.ts';

interface DefaultComponentModule {
  default?: MarkdownComponentDefinition;
  component?: MarkdownComponentDefinition;
  name?: unknown;
  install?: unknown;
  init?: unknown;
  dependsOn?: unknown;
}

interface ResolvedComponentModule {
  component: MarkdownComponentDefinition;
  runtimeExport: LoadedMarkdownComponent['runtimeExport'];
}

function assertComponentName(name: string, file: string): void {
  if (!/^[A-Za-z][\w-]*$/.test(name)) {
    throw new Error(
      `Invalid component name "${name}" in ${file}. Component names must match /^[A-Za-z][\\w-]*$/.`
    );
  }
}

function normalizeDependsOn(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function resolveComponentModule(
  mod: DefaultComponentModule
): ResolvedComponentModule | null {
  if (mod.default && typeof mod.default === 'object') {
    return {
      component: mod.default,
      runtimeExport: 'default',
    };
  }

  if (mod.component && typeof mod.component === 'object') {
    return {
      component: mod.component,
      runtimeExport: 'component',
    };
  }

  if (typeof mod.name === 'string') {
    return {
      component: {
        name: mod.name,
        install:
          typeof mod.install === 'function'
            ? (mod.install as MarkdownComponentDefinition['install'])
            : undefined,
        init:
          typeof mod.init === 'function'
            ? (mod.init as MarkdownComponentDefinition['init'])
            : undefined,
        dependsOn: normalizeDependsOn(mod.dependsOn),
      },
      runtimeExport: 'named',
    };
  }

  return null;
}

async function importComponent(file: string): Promise<LoadedMarkdownComponent> {
  const mod = (await import(
    `${pathToFileURL(file).href}?t=${Date.now()}`
  )) as DefaultComponentModule;
  const resolved = resolveComponentModule(mod);

  if (!resolved) {
    throw new Error(
      `Custom component ${file} must export a component object or named component fields.`
    );
  }

  const { component, runtimeExport } = resolved;
  const name = String(component.name || '').trim();
  assertComponentName(name, file);

  return {
    ...component,
    name,
    file,
    runtimeExport,
    dependsOn: normalizeDependsOn(component.dependsOn),
  };
}

export async function loadCustomComponents(
  componentsDir: string
): Promise<LoadedMarkdownComponent[]> {
  const files = (
    await glob(['*.ts', '*.js', '*/index.ts', '*/index.js'], {
      cwd: componentsDir,
      nodir: true,
      windowsPathsNoEscape: true,
    })
  )
    .map((file) => path.join(componentsDir, file))
    .sort();

  const components = await Promise.all(files.map(importComponent));
  const seen = new Set<string>();

  for (const component of components) {
    if (!seen.has(component.name)) {
      seen.add(component.name);
      continue;
    }

    throw new Error(`Duplicate custom component name "${component.name}".`);
  }

  return components;
}
