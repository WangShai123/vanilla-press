export type UnknownRecord = Record<string, unknown>;

export interface SeoData extends UnknownRecord {
  title?: string;
  keywords?: string;
  description?: string;
}

export interface LocaleEntry extends UnknownRecord {
  code?: string;
  path?: string;
  label?: string;
}

export interface HighlightLanguage extends UnknownRecord {
  value: string;
  label: string;
}

export type LanguageMessageValue =
  | string
  | number
  | boolean
  | null
  | LanguageMessageTree;

export interface LanguageMessageTree {
  [key: string]: LanguageMessageValue;
}

export type LanguageMessages = Record<string, LanguageMessageTree>;

export interface LanguagesConfig extends UnknownRecord {
  locale?: string;
  fallbackLocale?: string;
  locales?: LocaleEntry[];
  messages?: LanguageMessages | UnknownRecord;
  languages?: LanguageMessages | UnknownRecord;
}

export interface RuntimeI18nConfig extends UnknownRecord {
  locale?: string;
  fallbackLocale?: string;
  locales?: LocaleEntry[];
  redirectToDefault?: boolean;
}

export interface RuntimeFeatureConfig extends UnknownRecord {
  enabled?: boolean;
  label?: string;
}

export interface RuntimeHighlightConfig extends RuntimeFeatureConfig {
  languages?: HighlightLanguage[];
}

export interface RuntimeTocConfig extends RuntimeFeatureConfig {
  headings?: string;
  offset?: number;
}

export interface RuntimeLlmsFeatureConfig extends RuntimeFeatureConfig {
  link?: boolean;
  copy?: boolean;
  chatgpt?: boolean;
  claude?: boolean;
}

export interface RuntimeThemeDefaultConfig extends UnknownRecord {
  mode?: string;
  theme?: string;
  radius?: string;
  shadow?: string;
  font?: string;
}

export interface RuntimeThemeConfig extends RuntimeFeatureConfig {
  default?: RuntimeThemeDefaultConfig;
  options?: UnknownRecord;
  panel?: unknown;
  offcanvas?: {
    direction?: 'top' | 'right' | 'bottom' | 'left';
  } & UnknownRecord;
}

export type RuntimeFeatureSwitch = boolean | RuntimeFeatureConfig;
export type FooterScriptType = 'script' | 'module';
export type FooterScriptConfig = string;

export interface RuntimeConfig extends UnknownRecord {
  seo?: RuntimeFeatureSwitch;
  externalLink?: RuntimeFeatureSwitch;
  highlight?: boolean | RuntimeHighlightConfig;
  menu?: RuntimeFeatureSwitch;
  sidebar?: RuntimeFeatureSwitch;
  toc?: boolean | RuntimeTocConfig;
  search?: RuntimeFeatureSwitch;
  prevNext?: RuntimeFeatureSwitch;
  sitemap?: RuntimeFeatureSwitch;
  robots?: RuntimeFeatureSwitch;
  llms?: boolean | RuntimeLlmsFeatureConfig;
  i18n?: boolean | RuntimeI18nConfig;
  theme?: boolean | RuntimeThemeConfig;
  auth?: RuntimeFeatureSwitch;
  footerScript?: FooterScriptType;
}

export interface DocConfig extends UnknownRecord {
  siteUrl?: string;
  siteName?: string;
  social?: UnknownRecord;
  runtime?: RuntimeConfig;
  aside?: {
    html?: string;
  } & UnknownRecord;
}

export interface FrontmatterData extends UnknownRecord {
  layout?: string;
  layouts?: Record<string, unknown>;
}

export interface SourcePage {
  file: string;
  markdown: string;
  frontmatter: FrontmatterData;
  seo: SeoData;
  rel: string;
  title: string;
}

export interface PageScriptAsset {
  rel: string;
  code: string;
  sharedModules: SharedInlineScriptModule[];
}

export type SharedInlineScriptModule =
  | 'vanilla-jui'
  | 'vanilla-signal'
  | 'vanilla-create-storage'
  | 'vanilla-signal-i18n';

export interface RuntimePage extends UnknownRecord {
  rel?: string;
  title?: string;
  seo?: SeoData;
}

export interface DocI18n {
  t(key: string): string;
  getLocale(): string;
  getFallbackLocale(): string;
  setLocale(locale: string): unknown;
}

export interface NavItem extends UnknownRecord {
  id?: string | number;
  path?: string;
  href?: string;
  url?: string;
  i18n?: unknown;
  label?: unknown;
  title?: unknown;
  target?: string;
  classes?: string[];
  collapse?: boolean;
  children?: NavItem[];
}

export type MenuConfig = NavItem[];

export type SidebarConfig = NavItem[];

export interface RobotsRule extends UnknownRecord {
  userAgent?: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
}

export interface RobotsConfig extends UnknownRecord {
  rules?: RobotsRule[];
}

export interface LlmsLocaleLabels extends UnknownRecord {
  link?: string;
  copy?: string;
  chatgpt?: string;
  claude?: string;
  options?: string;
}

export interface LlmsConfig extends UnknownRecord {
  title?: string;
  description?: string;
  sectionTitle?: string;
  container?: {
    labels?: Record<string, LlmsLocaleLabels>;
  } & UnknownRecord;
}

export interface SearchIndexItem extends UnknownRecord {
  rel?: string;
  title?: string;
  keywords?: string;
  description?: string;
  content?: string;
  excerpt?: string;
}

export interface SearchIndexPayload extends UnknownRecord {
  searchIndex?: SearchIndexItem[];
}

export type SearchSource =
  | SearchIndexItem[]
  | SearchIndexPayload
  | (() =>
      | SearchIndexItem[]
      | SearchIndexPayload
      | Promise<SearchIndexItem[] | SearchIndexPayload>);

export interface RenderedPage extends SourcePage {
  body: string;
  content: string;
  components: string[];
  scripts: PageScriptAsset[];
  html: string;
}

export type LayoutSource = 'src' | 'docs';

export interface LayoutDefinition {
  name: string;
  source: LayoutSource;
  dir: string;
  template: string;
  style: string;
}

export type LayoutMap = Map<string, LayoutDefinition>;

export interface PageLayout {
  name: string;
  html: string;
}

export interface ChromeOptions {
  rel: string;
  menuEnabled: boolean;
  searchEnabled: boolean;
  i18nEnabled: boolean;
  sidebarEnabled: boolean;
  tocEnabled: boolean;
  themeEnabled: boolean;
  authEnabled: boolean;
}

export interface RuntimeBundleData {
  config?: DocConfig;
  languages?: LanguagesConfig | UnknownRecord;
  menuItems?: unknown[];
  sidebarItems?: unknown[];
  sharedInlineModules?: SharedInlineScriptModule[];
}

export interface BuildOptions {
  inputDir?: string;
  outputDir?: string;
}

export function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
