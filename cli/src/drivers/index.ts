import type { ProviderDriver } from '../types.js';
import { claudeDriver } from './claude.js';
import { cursorDriver } from './cursor.js';
import { copilotDriver } from './copilot.js';
import { windsurfDriver } from './windsurf.js';
import { clineDriver } from './cline.js';
import { openaiDriver } from './openai.js';
import { zedDriver } from './zed.js';
import { aiderDriver } from './aider.js';
import { continueDriver } from './continue.js';
import { junieDriver } from './junie.js';

const drivers: Record<string, ProviderDriver> = {
  claude: claudeDriver,
  cursor: cursorDriver,
  copilot: copilotDriver,
  windsurf: windsurfDriver,
  cline: clineDriver,
  openai: openaiDriver,
  zed: zedDriver,
  aider: aiderDriver,
  continue: continueDriver,
  junie: junieDriver,
};

export function getDriver(slug: string): ProviderDriver {
  const driver = drivers[slug];
  if (!driver) {
    throw new Error(`Unknown provider: ${slug}. Valid providers: ${Object.keys(drivers).join(', ')}`);
  }
  return driver;
}

export function getAllDrivers(): ProviderDriver[] {
  return Object.values(drivers);
}

export function getDriverSlugs(): string[] {
  return Object.keys(drivers);
}

/**
 * Register a driver (built-in or plugin). Throws if the plugin
 * doesn't implement the ProviderPlugin contract.
 */
export function registerDriver(driver: ProviderDriver): void {
  if (!driver || typeof driver !== 'object') {
    throw new Error('Plugin must be an object.');
  }
  if (typeof driver.slug !== 'string' || !driver.slug) {
    throw new Error('Plugin is missing a "slug".');
  }
  if (typeof driver.name !== 'string' || !driver.name) {
    throw new Error('Plugin is missing a "name".');
  }
  if (typeof driver.generate !== 'function') {
    throw new Error(`Plugin "${driver.slug}" is missing a generate() function.`);
  }
  drivers[driver.slug] = driver;
}

/**
 * Discover and load plugins from .skillr/plugins/*.{js,mjs}. Each file must
 * default-export a ProviderPlugin object.
 */
export async function loadPlugins(projectPath: string): Promise<string[]> {
  const { default: path } = await import('node:path');
  const { default: fs } = await import('node:fs/promises');
  const pluginsDir = path.join(projectPath, '.skillr', 'plugins');

  const loaded: string[] = [];
  let entries: string[];
  try {
    entries = await fs.readdir(pluginsDir);
  } catch {
    return loaded;
  }

  for (const entry of entries) {
    if (!/\.m?js$/.test(entry)) continue;
    const filePath = path.join(pluginsDir, entry);
    const mod = await import(`file://${filePath}`);
    const plugin = mod.default ?? mod;
    try {
      registerDriver(plugin);
      loaded.push(plugin.slug);
    } catch (err) {
      throw new Error(`Failed to load plugin "${entry}": ${(err as Error).message}`);
    }
  }
  return loaded;
}
