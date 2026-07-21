import { isLlmsEnabled } from "./features.js";

function asArray(value) {
  if (value === undefined || value === null || value === false) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanValue(value) {
  if (value === false || value === undefined || value === null) return null;
  const text = String(value ?? "").trim();
  return text || null;
}

function appendFields(lines, field, value) {
  for (const item of asArray(value)) {
    const text = cleanValue(item);
    if (text) lines.push(`${field}: ${text}`);
  }
}

function ruleUserAgents(rule = {}) {
  const userAgent =
    rule.userAgent ?? rule.userAgents ?? rule["user-agent"] ?? rule["user-agents"] ?? "*";
  const agents = asArray(userAgent).map(cleanValue).filter(Boolean);
  return agents.length ? agents : ["*"];
}

function renderRule(rule = {}) {
  const lines = ruleUserAgents(rule).map((agent) => `User-agent: ${agent}`);

  appendFields(lines, "Allow", rule.allow);
  appendFields(lines, "Disallow", rule.disallow);
  appendFields(lines, "Crawl-delay", rule.crawlDelay ?? rule["crawl-delay"]);

  return lines.join("\n");
}

function baseUrl(siteUrl) {
  const value = cleanValue(siteUrl);
  return value ? value.replace(/\/+$/g, "") : "";
}

function sitemapUrl(value, siteUrl) {
  const base = baseUrl(siteUrl);

  if (value === true) {
    return base ? `${base}/sitemap.xml` : null;
  }

  const text = cleanValue(value);
  if (!text) return null;
  if (/^https?:\/\//i.test(text)) return text;
  if (!base) return text;

  return `${base}/${text.replace(/^\/+/, "")}`;
}

function llmsUrl(value, siteUrl) {
  const base = baseUrl(siteUrl);

  if (value === true) {
    return base ? `${base}/llms.txt` : null;
  }

  const text = cleanValue(value);
  if (!text) return null;
  if (/^https?:\/\//i.test(text)) return text;
  if (!base) return text;

  return `${base}/${text.replace(/^\/+/, "")}`;
}

function renderSitemaps(config = {}, siteUrl) {
  return asArray(config.sitemap)
    .map((value) => sitemapUrl(value, siteUrl))
    .filter(Boolean)
    .map((url) => `Sitemap: ${url}`)
    .join("\n");
}

function renderLlms(config = {}, siteConfig = {}) {
  if (!isLlmsEnabled(siteConfig)) return "";

  return asArray(config.llms)
    .map((value) => llmsUrl(value, siteConfig.siteUrl))
    .filter(Boolean)
    .map((url) => `LLMs: ${url}`)
    .join("\n");
}

export function renderRobotsTxt(config = {}, siteConfig = {}) {
  const rules = Array.isArray(config.rules) ? config.rules : [config];
  const blocks = rules.map(renderRule).filter(Boolean);
  const sitemaps = renderSitemaps(config, siteConfig.siteUrl);
  const llms = renderLlms(config, siteConfig);

  if (sitemaps) blocks.push(sitemaps);
  if (llms) blocks.push(llms);

  return `${blocks.join("\n\n").trim()}\n`;
}
