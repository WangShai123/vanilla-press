import { escapeHtml } from "../../utilities/html.js";

function lookupPath(context, path = "") {
  const key = String(path || "").trim();
  if (!key) return "";
  if (key === "." || key === "this") return context?.this ?? "";

  const parts = key.split(".");
  let value = context;

  for (const part of parts) {
    if (value == null) return "";
    value = value[part];
  }

  return value ?? "";
}

function childContext(parent, value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      ...parent,
      ...value,
      this: value,
    };
  }

  return {
    ...parent,
    this: value,
  };
}

function renderValue(value, raw = false) {
  if (value == null || value === false) return "";
  if (Array.isArray(value) || typeof value === "object") return "";
  return raw ? String(value) : escapeHtml(value);
}

function renderSections(template, context) {
  return template.replace(
    /{{#\s*([A-Za-z_$][\w$.-]*)\s*}}([\s\S]*?){{\/\s*\1\s*}}/g,
    (_, key, content) => {
      const value = lookupPath(context, key);

      if (Array.isArray(value)) {
        return value.map((item) => renderTemplate(content, childContext(context, item))).join("");
      }

      if (value && typeof value === "object") {
        return renderTemplate(content, childContext(context, value));
      }

      return value ? renderTemplate(content, context) : "";
    },
  );
}

export function renderTemplate(template = "", context = {}) {
  const withSections = renderSections(String(template), context);
  const rawValues = [];
  const withRawPlaceholders = withSections.replace(
    /{{{\s*([A-Za-z_$][\w$.-]*)\s*}}}/g,
    (_, key) => {
      const index = rawValues.push(renderValue(lookupPath(context, key), true)) - 1;
      return `___DOC_TEMPLATE_RAW_${index}___`;
    },
  );

  return withRawPlaceholders
    .replace(/{{\s*([A-Za-z_$][\w$.-]*)\s*}}/g, (_, key) =>
      renderValue(lookupPath(context, key)),
    )
    .replace(/___DOC_TEMPLATE_RAW_(\d+)___/g, (_, index) => rawValues[Number(index)] || "");
}
