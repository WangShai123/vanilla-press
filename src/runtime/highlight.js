const LANG_ALIASES = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  sh: "bash",
  shell: "bash",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function highlightPlainJavaScript(value) {
  return value.replace(
    /\b(const|let|var|function|return|import|from|export|if|else|for|while|class|new|await|async|true|false|null|undefined)\b|\b(\d+(?:\.\d+)?)\b/g,
    (match, keyword, number) => {
      if (keyword) return `<span class="hljs-keyword">${escapeHtml(keyword)}</span>`;
      if (number) return `<span class="hljs-number">${escapeHtml(number)}</span>`;
      return escapeHtml(match);
    },
  );
}

function highlightJavaScript(code) {
  let index = 0;
  let html = "";

  while (index < code.length) {
    const char = code[index];
    const next = code[index + 1];

    if (char === "/" && next === "/") {
      const end = code.indexOf("\n", index);
      const stop = end === -1 ? code.length : end;
      html += `<span class="hljs-comment">${escapeHtml(code.slice(index, stop))}</span>`;
      index = stop;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      const quote = char;
      let stop = index + 1;
      while (stop < code.length) {
        if (code[stop] === "\\") {
          stop += 2;
          continue;
        }
        if (code[stop] === quote) {
          stop += 1;
          break;
        }
        stop += 1;
      }
      html += `<span class="hljs-string">${escapeHtml(code.slice(index, stop))}</span>`;
      index = stop;
      continue;
    }

    let stop = index + 1;
    while (stop < code.length) {
      const current = code[stop];
      const lookahead = code[stop + 1];
      if (
        current === '"' ||
        current === "'" ||
        current === "`" ||
        (current === "/" && lookahead === "/")
      ) {
        break;
      }
      stop += 1;
    }
    html += highlightPlainJavaScript(escapeHtml(code.slice(index, stop)));
    index = stop;
  }

  return html;
}

function highlightMarkup(code) {
  return escapeHtml(code).replace(
    /(&lt;\/?)([A-Za-z][\w-]*)(.*?)(\/?&gt;)/g,
    (_match, open, tag, attrs, close) => {
      const highlightedAttrs = attrs.replace(
        /([\w:-]+)(=)(&quot;.*?&quot;|'.*?')/g,
        '<span class="hljs-attr">$1</span>$2<span class="hljs-string">$3</span>',
      );
      return `${open}<span class="hljs-name">${tag}</span>${highlightedAttrs}${close}`;
    },
  );
}

export function normalizeLang(lang = "") {
  const normalized = String(lang).trim().toLowerCase();
  return LANG_ALIASES[normalized] || normalized || "text";
}

export function highlight(code, lang) {
  const language = normalizeLang(lang);
  const highlighted =
    language === "javascript" || language === "typescript"
      ? highlightJavaScript(code)
      : language === "html" || language === "xml"
        ? highlightMarkup(code)
        : escapeHtml(code);

  return `<pre class="j-code-editor hljs"><code class="language-${language}">${highlighted}</code></pre>`;
}
