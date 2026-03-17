<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Skill;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Symfony\Component\Yaml\Yaml;

class ProviderImportService
{
    private const PARSERS = [
        'claude' => 'parseClaude',
        'cursor' => 'parseCursor',
        'copilot' => 'parseCopilot',
        'windsurf' => 'parseWindsurf',
        'cline' => 'parseCline',
        'openai' => 'parseOpenAI',
        'codex' => 'parseCodex',
    ];

    /**
     * Detect provider config files at the given path and extract skills.
     *
     * @return array<string, array<array{name: string, slug: string, body: string, description: ?string, tags: string[], model: ?string}>>
     */
    public function detect(string $path, ?string $providerFilter = null): array
    {
        $results = [];

        foreach (self::PARSERS as $provider => $method) {
            if ($providerFilter && $providerFilter !== $provider) {
                continue;
            }

            $skills = $this->{$method}($path);

            if (! empty($skills)) {
                $results[$provider] = $skills;
            }
        }

        return $results;
    }

    /**
     * Import detected skills into a project.
     */
    public function import(Project $project, array $detected): array
    {
        $created = 0;
        $skipped = 0;

        $existingSlugs = $project->skills()->pluck('slug')->toArray();

        foreach ($detected as $provider => $skills) {
            foreach ($skills as $skillData) {
                $slug = $skillData['slug'];

                if (in_array($slug, $existingSlugs)) {
                    $skipped++;

                    continue;
                }

                $skill = $project->skills()->create([
                    'uuid' => Str::uuid()->toString(),
                    'slug' => $slug,
                    'name' => $skillData['name'],
                    'description' => $skillData['description'] ?? null,
                    'model' => $skillData['model'] ?? null,
                    'body' => $skillData['body'],
                    'tools' => [],
                    'includes' => [],
                ]);

                // Attach tags — include source provider tag for traceability
                $tagNames = $skillData['tags'] ?? [];
                $tagNames[] = "imported:{$provider}";

                $tagIds = [];
                foreach ($tagNames as $tagName) {
                    $tag = \App\Models\Tag::firstOrCreate(['name' => trim($tagName)]);
                    $tagIds[] = $tag->id;
                }
                $skill->tags()->sync($tagIds);

                // Create initial version
                $skill->versions()->create([
                    'version_number' => 1,
                    'frontmatter' => [
                        'id' => $slug,
                        'name' => $skillData['name'],
                        'description' => $skillData['description'] ?? null,
                        'tags' => $tagNames,
                    ],
                    'body' => $skillData['body'],
                    'note' => "Imported from {$provider}",
                    'saved_at' => now(),
                ]);

                // Write to .skillr/skills/
                $frontmatter = [
                    'id' => $slug,
                    'name' => $skillData['name'],
                    'description' => $skillData['description'] ?? null,
                    'tags' => $tagNames,
                    'model' => $skillData['model'] ?? null,
                    'tools' => [],
                    'includes' => [],
                    'created_at' => $skill->created_at->toIso8601String(),
                    'updated_at' => $skill->updated_at->toIso8601String(),
                ];

                app(SkillrManifestService::class)->writeSkillFile(
                    $project->resolved_path,
                    $frontmatter,
                    $skillData['body'],
                );

                $existingSlugs[] = $slug;
                $created++;
            }
        }

        return ['created' => $created, 'skipped' => $skipped];
    }

    /**
     * Parse Claude: .claude/CLAUDE.md → H2 sections as skills
     */
    private function parseClaude(string $path): array
    {
        $file = $path . '/.claude/CLAUDE.md';
        if (! File::exists($file)) {
            $file = $path . '/CLAUDE.md';
        }

        if (! File::exists($file)) {
            return [];
        }

        return $this->parseMarkdownHeadings(File::get($file), 2);
    }

    /**
     * Parse Cursor: .cursor/rules/*.mdc → YAML frontmatter + body per file
     */
    private function parseCursor(string $path): array
    {
        $dir = $path . '/.cursor/rules';
        if (! File::isDirectory($dir)) {
            return [];
        }

        $skills = [];
        foreach (File::glob($dir . '/*.mdc') as $file) {
            $content = File::get($file);
            $parsed = $this->parseFrontmatter($content);

            $slug = pathinfo($file, PATHINFO_FILENAME);
            $name = Str::title(str_replace('-', ' ', $slug));

            $tags = [];
            if (! empty($parsed['frontmatter']['tags'])) {
                $tags = (array) $parsed['frontmatter']['tags'];
            }

            $skills[] = [
                'name' => $name,
                'slug' => $slug,
                'description' => $parsed['frontmatter']['description'] ?? null,
                'body' => trim($parsed['body']),
                'tags' => $tags,
                'model' => null,
            ];
        }

        return $skills;
    }

    /**
     * Parse Copilot: .github/copilot-instructions.md → H2 sections
     */
    private function parseCopilot(string $path): array
    {
        $file = $path . '/.github/copilot-instructions.md';

        if (! File::exists($file)) {
            return [];
        }

        return $this->parseMarkdownHeadings(File::get($file), 2);
    }

    /**
     * Parse Windsurf: .windsurf/rules/*.md → H1 + body per file
     */
    private function parseWindsurf(string $path): array
    {
        $dir = $path . '/.windsurf/rules';
        if (! File::isDirectory($dir)) {
            return [];
        }

        $skills = [];
        foreach (File::glob($dir . '/*.md') as $file) {
            $content = File::get($file);
            $slug = pathinfo($file, PATHINFO_FILENAME);

            $name = Str::title(str_replace('-', ' ', $slug));
            $body = $content;

            if (preg_match('/^#\s+(.+)$/m', $content, $matches)) {
                $name = trim($matches[1]);
                $body = trim(preg_replace('/^#\s+.+\n*/m', '', $content, 1));
            }

            $skills[] = [
                'name' => $name,
                'slug' => $slug,
                'description' => null,
                'body' => $body,
                'tags' => [],
                'model' => null,
            ];
        }

        return $skills;
    }

    /**
     * Parse Cline: .clinerules → H1 sections
     */
    private function parseCline(string $path): array
    {
        $file = $path . '/.clinerules';

        if (! File::exists($file)) {
            return [];
        }

        return $this->parseMarkdownHeadings(File::get($file), 1);
    }

    /**
     * Parse OpenAI: .openai/instructions.md → H2 sections
     */
    private function parseOpenAI(string $path): array
    {
        $file = $path . '/.openai/instructions.md';

        if (! File::exists($file)) {
            return [];
        }

        return $this->parseMarkdownHeadings(File::get($file), 2);
    }

    /**
     * Parse Codex CLI: AGENTS.md at project root (H2 sections) + .codex/*.md files
     */
    private function parseCodex(string $path): array
    {
        $skills = [];

        // Check for AGENTS.md at project root
        $agentsFile = $path . '/AGENTS.md';
        if (File::exists($agentsFile)) {
            $skills = array_merge($skills, $this->parseMarkdownHeadings(File::get($agentsFile), 2));
        }

        // Check for .codex/ directory with .md files
        $codexDir = $path . '/.codex';
        if (File::isDirectory($codexDir)) {
            foreach (File::glob($codexDir . '/*.md') as $file) {
                $content = File::get($file);
                $slug = pathinfo($file, PATHINFO_FILENAME);

                $name = Str::title(str_replace('-', ' ', $slug));
                $body = $content;

                if (preg_match('/^#\s+(.+)$/m', $content, $matches)) {
                    $name = trim($matches[1]);
                    $body = trim(preg_replace('/^#\s+.+\n*/m', '', $content, 1));
                }

                if (! empty(trim($body))) {
                    $skills[] = [
                        'name' => $name,
                        'slug' => $slug,
                        'description' => null,
                        'body' => $body,
                        'tags' => [],
                        'model' => null,
                    ];
                }
            }
        }

        return $skills;
    }

    /**
     * Split markdown content by heading level into individual skills.
     */
    private function parseMarkdownHeadings(string $content, int $level): array
    {
        $prefix = str_repeat('#', $level);
        $pattern = '/^' . $prefix . '\s+(.+)$/m';

        $parts = preg_split($pattern, $content, -1, PREG_SPLIT_DELIM_CAPTURE);

        if (count($parts) < 3) {
            return [];
        }

        $skills = [];

        for ($i = 1; $i < count($parts); $i += 2) {
            $name = trim($parts[$i]);
            $body = isset($parts[$i + 1]) ? trim($parts[$i + 1]) : '';

            $body = preg_replace('/\n---\s*$/', '', $body);
            $body = trim($body);

            if (empty($body)) {
                continue;
            }

            if (in_array(strtolower($name), ['claude.md', 'github copilot instructions', 'agents'])) {
                continue;
            }

            $slug = Str::slug($name);

            $skills[] = [
                'name' => $name,
                'slug' => $slug,
                'description' => null,
                'body' => $body,
                'tags' => [],
                'model' => null,
            ];
        }

        return $skills;
    }

    /**
     * Parse YAML frontmatter from content (Cursor MDC format).
     */
    private function parseFrontmatter(string $content): array
    {
        if (! str_starts_with($content, '---')) {
            return ['frontmatter' => [], 'body' => $content];
        }

        $parts = preg_split('/^---\s*$/m', $content, 3);

        if (count($parts) < 3) {
            return ['frontmatter' => [], 'body' => $content];
        }

        try {
            $frontmatter = Yaml::parse(trim($parts[1])) ?? [];
        } catch (\Exception $e) {
            $frontmatter = [];
        }

        return [
            'frontmatter' => $frontmatter,
            'body' => trim($parts[2]),
        ];
    }
}
