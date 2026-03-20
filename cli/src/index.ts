// Public API — for programmatic use
export * from './types.js';
export { parseContent, renderFile, validateFrontmatter, slugify } from './services/SkillFileParser.js';
export { resolve as resolveIncludes } from './services/SkillCompositionService.js';
export { resolve as resolveTemplates, extractVariables, getMissing } from './services/TemplateResolver.js';
export { lint } from './services/PromptLinter.js';
export { scanProject, scaffoldProject, readManifest, writeManifest } from './services/ManifestService.js';
export { sync, preview, resolveSkills } from './services/SyncService.js';
export { getDriver, getAllDrivers, getDriverSlugs } from './drivers/index.js';
