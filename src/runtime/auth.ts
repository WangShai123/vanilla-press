import { all, icon } from 'vanilla-jui';
import { createEffect, jsx } from 'vanilla-signal';

import type { DocConfig, DocI18n, RuntimeFeatureConfig } from '../types.ts';
import { isRecord } from '../types.ts';
import { isAuthEnabled, runtimeOption } from '../utilities/features.ts';

function authOptions(config: DocConfig): RuntimeFeatureConfig {
  const value = runtimeOption(config, 'auth');
  return isRecord(value) ? value : {};
}

export function initAuth(config: DocConfig = {}, i18n: DocI18n): void {
  const authConfig = authOptions(config);
  const buttons = all<HTMLButtonElement>('[data-doc-auth]').filter(
    (button) => button.dataset.docReady !== 'true'
  );
  if (!buttons.length) return;

  if (!isAuthEnabled(config)) {
    buttons.forEach((button) => {
      button.hidden = true;
      button.textContent = '';
      button.dataset.docReady = 'true';
    });
    return;
  }

  buttons.forEach((button) => {
    button.hidden = false;
    button.textContent = '';
    button.append(icon('user', { className: 'el-icon el-prefix' }));

    if (!button.classList.contains('is-icon')) {
      const text = jsx('span', { className: 'button-content' });
      button.append(text);

      createEffect(() => {
        text.textContent = i18n.t(String(authConfig.label || 'auth.login'));
      });
    }

    button.dataset.docReady = 'true';
  });
}
