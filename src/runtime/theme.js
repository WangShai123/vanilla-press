import { createEffect } from "vanilla-signal";
import { Theme, createOffcanvas, icon } from "vanilla-jui";
import { isThemeEnabled, runtimeOption } from "../utilities/features.js";

export function initTheme(config = {}, i18n) {
  const themeConfig = runtimeOption(config, "theme") || {};
  const buttons = Array.from(document.querySelectorAll("[data-doc-theme]")).filter(
    (button) => button.dataset.docReady !== "true",
  );
  if (!buttons.length) return;

  if (!isThemeEnabled(config)) {
    buttons.forEach((button) => {
      button.hidden = true;
      button.textContent = "";
      button.dataset.docReady = "true";
    });
    return;
  }

  const theme = new Theme(themeConfig.options || {});
  const panel = theme.createPanel("j-theme-palette", themeConfig.panel || null);
  const drawer = createOffcanvas({
    direction: themeConfig.offcanvas?.direction || "right",
    content: panel,
  });

  buttons.forEach((button) => {
    button.hidden = false;
    button.textContent = "";
    button.append(icon("palette", { className: "el-icon el-prefix" }));

    if (!button.classList.contains("is-icon")) {
      const text = document.createElement("span");
      text.className = "button-content";
      button.append(text);

      createEffect(() => {
        text.textContent = i18n.t(themeConfig.label || "theme.button");
      });
    }

    button.addEventListener("click", () => drawer.show());
    button.dataset.docReady = "true";
  });
}
