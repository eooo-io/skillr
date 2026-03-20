import type { ParsedSkill, LintIssue } from '../types.js';

const VAGUE_PATTERNS = [
  /\bdo your best\b/i,
  /\bif possible\b/i,
  /\bas needed\b/i,
  /\bas appropriate\b/i,
  /\btry to\b/i,
  /\bfeel free\b/i,
  /\bwhen necessary\b/i,
  /\bif you can\b/i,
  /\bwhen appropriate\b/i,
];

const WEAK_CONSTRAINT_PATTERNS = [
  /\byou should\b/i,
  /\byou could\b/i,
  /\byou might\b/i,
  /\bconsider\b/i,
  /\bit would be nice\b/i,
];

const CONFLICTING_PAIRS: [RegExp, RegExp, string][] = [
  [/\bbe concise\b/i, /\bbe thorough\b/i, 'concise vs. thorough'],
  [/\bbe brief\b/i, /\bbe detailed\b/i, 'brief vs. detailed'],
  [/\bkeep it short\b/i, /\bexplain in detail\b/i, 'short vs. detailed explanation'],
];

const ROLE_CONFUSION_PATTERNS = [
  /\byou are (a|an|the) user\b/i,
  /\bas the user\b/i,
  /\bpretend to be\b/i,
  /\broleplay as\b/i,
];

const GENERIC_DESCRIPTION_PATTERNS = [
  /^helps? with/i,
  /^does? stuff/i,
  /^general purpose/i,
  /^a? ?tool for/i,
  /^useful for/i,
];

/**
 * Run all lint rules against a parsed skill.
 */
export function lint(skill: ParsedSkill): LintIssue[] {
  const issues: LintIssue[] = [];
  const { body } = skill;
  const { description, gotchas, skill_type } = skill.frontmatter;
  const lines = body.split('\n');

  // Rule 1: Empty body
  if (!body.trim()) {
    issues.push({
      rule: 'empty_body',
      severity: 'warning',
      message: 'Skill body is empty.',
      suggestion: 'Add instructions that tell the AI what to do.',
    });
    return issues; // No point checking other rules
  }

  // Rule 2: Vague instructions
  for (const pattern of VAGUE_PATTERNS) {
    const lineNum = findLine(lines, pattern);
    if (lineNum !== undefined) {
      issues.push({
        rule: 'vague_instructions',
        severity: 'warning',
        message: `Vague instruction found: "${lines[lineNum].trim()}"`,
        suggestion: 'Replace with specific, measurable instructions. Use "you must" instead of "try to".',
        line: lineNum + 1,
      });
      break;
    }
  }

  // Rule 3: Weak constraints
  for (const pattern of WEAK_CONSTRAINT_PATTERNS) {
    const lineNum = findLine(lines, pattern);
    if (lineNum !== undefined) {
      issues.push({
        rule: 'weak_constraints',
        severity: 'suggestion',
        message: `Weak constraint found: "${lines[lineNum].trim()}"`,
        suggestion: 'Use "you must" or "always" instead of "you should" or "consider".',
        line: lineNum + 1,
      });
      break;
    }
  }

  // Rule 4: Conflicting directives
  for (const [patternA, patternB, label] of CONFLICTING_PAIRS) {
    if (patternA.test(body) && patternB.test(body)) {
      issues.push({
        rule: 'conflicting_directives',
        severity: 'warning',
        message: `Conflicting directives detected: ${label}.`,
        suggestion: 'Choose one approach and remove the conflicting instruction.',
      });
      break;
    }
  }

  // Rule 5: Missing output format
  const hasOutputFormat = /\b(output format|respond with|return as|format:|example output|response format)\b/i.test(body);
  const hasCodeBlock = /```/.test(body);
  if (!hasOutputFormat && !hasCodeBlock && estimateTokens(body) > 200) {
    issues.push({
      rule: 'missing_output_format',
      severity: 'suggestion',
      message: 'No output format specified.',
      suggestion: 'Add an "Output Format" or "Example" section showing the expected response structure.',
    });
  }

  // Rule 6: Excessive length
  const tokens = estimateTokens(body);
  if (tokens > 8000) {
    issues.push({
      rule: 'excessive_length',
      severity: 'warning',
      message: `Skill body is ~${tokens} tokens. This may exceed context limits or dilute key instructions.`,
      suggestion: 'Split into smaller skills and use the includes system to compose them.',
    });
  }

  // Rule 7: Role confusion
  for (const pattern of ROLE_CONFUSION_PATTERNS) {
    const lineNum = findLine(lines, pattern);
    if (lineNum !== undefined) {
      issues.push({
        rule: 'role_confusion',
        severity: 'warning',
        message: `Potential role confusion: "${lines[lineNum].trim()}"`,
        suggestion: 'Ensure clear separation between AI role and user role.',
        line: lineNum + 1,
      });
      break;
    }
  }

  // Rule 8: Missing examples
  const hasExample = /\b(example|for instance|e\.g\.|such as)\b/i.test(body) || hasCodeBlock;
  if (!hasExample && tokens > 300) {
    issues.push({
      rule: 'missing_examples',
      severity: 'suggestion',
      message: 'No examples found in a substantial skill.',
      suggestion: 'Add concrete examples showing expected input/output to improve accuracy.',
    });
  }

  // Rule 9: Redundancy (repeated headings)
  const headings = lines.filter((l) => /^##?\s/.test(l)).map((l) => l.toLowerCase().trim());
  const seen = new Set<string>();
  for (const h of headings) {
    if (seen.has(h)) {
      issues.push({
        rule: 'redundancy',
        severity: 'suggestion',
        message: `Duplicate heading: "${h}"`,
        suggestion: 'Merge duplicate sections to reduce redundancy.',
      });
      break;
    }
    seen.add(h);
  }

  // Rule 10: Missing gotchas
  if (tokens > 500 && !gotchas && !/## (gotchas|common gotchas|pitfalls|warnings)/i.test(body)) {
    issues.push({
      rule: 'missing_gotchas',
      severity: 'suggestion',
      message: 'Complex skill without gotchas. Gotcha sections are the highest-signal content in any skill.',
      suggestion: 'Add common failure points and edge cases to the gotchas field.',
    });
  }

  // Rule 11: Vague description
  if (description) {
    if (description.length < 20 || GENERIC_DESCRIPTION_PATTERNS.some((p) => p.test(description))) {
      issues.push({
        rule: 'vague_description',
        severity: 'warning',
        message: 'Vague skill description may cause poor agent triggering.',
        suggestion: 'Write a specific description that tells the agent exactly when this skill applies.',
      });
    }
  }

  // Rule 11b: Missing skill type
  if (!skill_type && tokens > 200) {
    issues.push({
      rule: 'missing_skill_type',
      severity: 'suggestion',
      message: 'No skill type set (capability-uplift or encoded-preference).',
      suggestion: 'Set skill_type to help agents understand how to apply this skill.',
    });
  }

  return issues;
}

function findLine(lines: string[], pattern: RegExp): number | undefined {
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) return i;
  }
  return undefined;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
