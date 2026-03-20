import { hasSkillrDir, scanProject } from '../services/ManifestService.js';
import { resolve as resolveIncludes } from '../services/SkillCompositionService.js';
import { resolve as resolveTemplates } from '../services/TemplateResolver.js';
import type { ParsedSkill } from '../types.js';
import * as ui from '../ui.js';

export async function testCommand(
  slug: string,
  options: { message?: string; model?: string },
): Promise<void> {
  const projectPath = process.cwd();

  if (!(await hasSkillrDir(projectPath))) {
    ui.error('No .skillr/ found. Run `skillr init` first.');
    process.exit(1);
  }

  const { skills } = await scanProject(projectPath);
  const skill = skills.find((s) => s.slug === slug);

  if (!skill) {
    ui.error(`Skill not found: ${slug}`);
    process.exit(1);
  }

  // Resolve includes
  const skillMap = new Map<string, ParsedSkill>();
  for (const s of skills) skillMap.set(s.slug, s);

  let body = resolveIncludes(skill, skillMap);

  // Resolve template defaults
  const vars: Record<string, string> = {};
  for (const def of skill.frontmatter.template_variables ?? []) {
    if (def.default != null) vars[def.name] = def.default;
  }
  if (Object.keys(vars).length > 0) {
    body = resolveTemplates(body, vars);
  }

  const model = options.model ?? skill.frontmatter.model ?? 'claude-sonnet-4-6';
  const userMessage = options.message ?? 'Hello, please introduce yourself and explain what you can help with.';

  ui.thinking(`Testing "${skill.frontmatter.name}" with ${model}...`);
  ui.blank();

  // Detect provider from model name
  if (model.startsWith('claude') || model.startsWith('anthropic')) {
    await testWithAnthropic(body, userMessage, model);
  } else if (model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('o3')) {
    await testWithOpenAI(body, userMessage, model);
  } else {
    ui.error(`Unsupported model: ${model}. Set ANTHROPIC_API_KEY or OPENAI_API_KEY and use a supported model.`);
    process.exit(1);
  }
}

async function testWithAnthropic(systemPrompt: string, userMessage: string, model: string): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    ui.error('ANTHROPIC_API_KEY not set. Export it to test with Claude models.');
    process.exit(1);
  }

  try {
    // @ts-ignore — optional peer dependency
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });
    const start = Date.now();

    const stream = client.messages.stream({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        process.stdout.write(event.delta.text);
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const response = await stream.finalMessage();
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;

    ui.blank();
    ui.blank();
    ui.success(`Done in ${elapsed}s — ${inputTokens} input, ${outputTokens} output tokens`);
  } catch (err) {
    ui.blank();
    ui.error(`Anthropic API error: ${(err as Error).message}`);
    process.exit(1);
  }
}

async function testWithOpenAI(systemPrompt: string, userMessage: string, model: string): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    ui.error('OPENAI_API_KEY not set. Export it to test with OpenAI models.');
    process.exit(1);
  }

  try {
    // @ts-ignore — optional peer dependency
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey });
    const start = Date.now();

    const stream = await client.chat.completions.create({
      model,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) process.stdout.write(text);
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    ui.blank();
    ui.blank();
    ui.success(`Done in ${elapsed}s`);
  } catch (err) {
    ui.blank();
    ui.error(`OpenAI API error: ${(err as Error).message}`);
    process.exit(1);
  }
}
