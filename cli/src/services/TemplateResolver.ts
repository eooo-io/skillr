/**
 * Replace {{variable_name}} placeholders with values.
 * Unresolved variables are left as-is.
 */
export function resolve(body: string, variables: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return variables[key] ?? match;
  });
}

/**
 * Extract all variable names found in the body.
 */
export function extractVariables(body: string): string[] {
  const matches = body.matchAll(/\{\{(\w+)\}\}/g);
  const names = new Set<string>();
  for (const match of matches) {
    names.add(match[1]);
  }
  return [...names];
}

/**
 * Return variable names that have no value provided.
 */
export function getMissing(body: string, variables: Record<string, string>): string[] {
  const found = extractVariables(body);
  return found.filter((name) => !(name in variables) || variables[name] == null);
}
