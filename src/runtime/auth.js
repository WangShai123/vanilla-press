import { createEffect, jsx } from "vanilla-signal";
import { all, icon } from "vanilla-jui";
import { isAuthEnabled, runtimeOption } from "../utilities/features.js";

export function initAuth(config = {}, i18n) {
  const authConfig = runtimeOption(config, "auth") || {};
  const buttons = all("[data-doc-auth]").filter(
    (button) => button.dataset.docReady !== "true",
  );
  if (!buttons.length) return;

  if (!isAuthEnabled(config)) {
    buttons.forEach((button) => {
      button.hidden = true;
      button.textContent = "";
      button.dataset.docReady = "true";
    });
    return;
  }

  buttons.forEach((button) => {
    button.hidden = false;
    button.textContent = "";
    button.append(icon("user", { className: "el-icon el-prefix" }));

    if (!button.classList.contains("is-icon")) {
      const text = jsx("span", { className: "button-content" });
      button.append(text);

      createEffect(() => {
        text.textContent = i18n.t(authConfig.label || "auth.login");
      });
    }

    button.dataset.docReady = "true";
  });
}
