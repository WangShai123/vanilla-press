import {
  all,
  createOffcanvas,
  createTheme,
  icon,
  type OffcanvasDirection,
  type ThemeOptions,
  type ThemePanelGroup,
} from 'vanilla-jui';
import { createEffect, jsx } from 'vanilla-signal';

import type { DocConfig, DocI18n, RuntimeFeatureConfig } from '../types.ts';
import { isRecord } from '../types.ts';
import { isThemeEnabled, runtimeOption } from '../utilities/features.ts';

interface DocThemeConfig extends RuntimeFeatureConfig {
  options?: ThemeOptions;
  panel?: ThemePanelGroup[] | null;
  offcanvas?: {
    direction?: OffcanvasDirection;
  };
}

function themeOptions(config: DocConfig): DocThemeConfig {
  const value = runtimeOption(config, 'theme');
  return isRecord(value) ? (value as DocThemeConfig) : {};
}

export function initTheme(config: DocConfig = {}, i18n: DocI18n): void {
  const themeConfig = themeOptions(config);
  const buttons = all<HTMLButtonElement>('[data-vp-theme]').filter(
    (button) => button.dataset.vpReady !== 'true'
  );
  if (!buttons.length) return;

  if (!isThemeEnabled(config)) {
    buttons.forEach((button) => {
      button.hidden = true;
      button.textContent = '';
      button.dataset.vpReady = 'true';
    });
    return;
  }

  const theme = createTheme(themeConfig.options || {});
  const drawer = createOffcanvas({
    direction: themeConfig.offcanvas?.direction || 'right',
    content: theme.createPanel('j-theme-palette', themeConfig.panel || null),
    cache: true,
  }).build();

  buttons.forEach((button) => {
    button.hidden = false;
    button.textContent = '';
    button.append(icon('palette', { className: 'el-icon el-prefix' }));

    if (!button.classList.contains('is-icon')) {
      const text = jsx('span', { className: 'button-content' });
      button.append(text);

      createEffect(() => {
        text.textContent = i18n.t(String(themeConfig.label || 'theme.button'));
      });
    }

    button.addEventListener('click', () => drawer.show());
    button.dataset.vpReady = 'true';
  });
}
