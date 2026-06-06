// Shared syntax-highlight themes for the <Code> component. Kept in one place so
// CodeFile and RunnableSnippet stay in sync, and matching the markdown
// shikiConfig in astro.config.mjs. defaultColor 'dark' bakes the dark palette
// inline (the site is dark-first) and exposes the light palette as --shiki-light*
// custom properties, which Layout.astro swaps in for the light theme.
export const CODE_THEMES = { light: 'github-light', dark: 'github-dark' } as const;
export const CODE_DEFAULT_COLOR = 'dark';
