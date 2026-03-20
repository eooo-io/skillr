import type { ProviderDriver } from '../types.js';
import { claudeDriver } from './claude.js';
import { cursorDriver } from './cursor.js';
import { copilotDriver } from './copilot.js';
import { windsurfDriver } from './windsurf.js';
import { clineDriver } from './cline.js';
import { openaiDriver } from './openai.js';

const drivers: Record<string, ProviderDriver> = {
  claude: claudeDriver,
  cursor: cursorDriver,
  copilot: copilotDriver,
  windsurf: windsurfDriver,
  cline: clineDriver,
  openai: openaiDriver,
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
