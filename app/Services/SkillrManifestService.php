<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Support\Facades\File;

class SkillrManifestService
{
    public function __construct(
        protected SkillFileParser $parser,
    ) {}

    /**
     * Scan a project directory and return manifest + parsed skills.
     * Supports both flat .md files and folder-based skills (slug/skill.md).
     *
     * @return array{manifest: array|null, skills: array}
     */
    public function scanProject(string $absolutePath): array
    {
        $skillrDir = rtrim($absolutePath, '/') . '/.skillr';
        $manifest = null;
        $skills = [];

        $manifestPath = $skillrDir . '/manifest.json';
        if (File::exists($manifestPath)) {
            $manifest = json_decode(File::get($manifestPath), true);
        }

        $skillsDir = $skillrDir . '/skills';
        if (File::isDirectory($skillsDir)) {
            // Flat .md files
            $files = File::glob($skillsDir . '/*.md');
            foreach ($files as $file) {
                $parsed = $this->parser->parseFile($file);
                $parsed['filename'] = basename($file, '.md');
                $skills[] = $parsed;
            }

            // Folder-based skills: {slug}/skill.md
            $dirs = File::directories($skillsDir);
            foreach ($dirs as $dir) {
                $skillFile = $dir . '/skill.md';
                if (! File::exists($skillFile)) {
                    continue;
                }

                $parsed = $this->parser->parseFile($skillFile);
                $parsed['filename'] = basename($dir);

                // Read gotchas.md if it exists
                $gotchasFile = $dir . '/gotchas.md';
                if (File::exists($gotchasFile)) {
                    $parsed['frontmatter']['gotchas'] = File::get($gotchasFile);
                }

                // Discover supplementary files (everything except skill.md and gotchas.md)
                $supplementary = [];
                $allFiles = File::allFiles($dir);
                foreach ($allFiles as $supplementaryFile) {
                    $relativePath = $supplementaryFile->getRelativePathname();
                    if (in_array($relativePath, ['skill.md', 'gotchas.md'])) {
                        continue;
                    }
                    $supplementary[] = [
                        'path' => $relativePath,
                        'content' => File::get($supplementaryFile->getPathname()),
                    ];
                }

                if (! empty($supplementary)) {
                    $parsed['frontmatter']['supplementary_files'] = $supplementary;
                }

                $skills[] = $parsed;
            }
        }

        return [
            'manifest' => $manifest,
            'skills' => $skills,
        ];
    }

    /**
     * Write the .skillr/manifest.json from current DB state.
     */
    public function writeManifest(Project $project): void
    {
        $project->loadMissing(['providers', 'skills']);

        $manifest = [
            'id' => $project->uuid,
            'name' => $project->name,
            'path' => $project->path,
            'description' => $project->description,
            'providers' => $project->providers->pluck('provider_slug')->values()->all(),
            'skills' => $project->skills->pluck('slug')->values()->all(),
            'created_at' => $project->created_at?->toIso8601String(),
            'synced_at' => $project->synced_at?->toIso8601String(),
        ];

        $dir = rtrim($project->resolved_path, '/') . '/.skillr';
        File::ensureDirectoryExists($dir);
        File::put($dir . '/manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
    }

    /**
     * Scaffold a new .skillr/ directory structure.
     */
    public function scaffoldProject(string $absolutePath, string $name): void
    {
        $skillrDir = rtrim($absolutePath, '/') . '/.skillr';

        File::ensureDirectoryExists($skillrDir . '/skills');

        $manifest = [
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => $name,
            'path' => $absolutePath,
            'description' => '',
            'providers' => [],
            'skills' => [],
            'created_at' => now()->toIso8601String(),
            'synced_at' => null,
        ];

        File::put($skillrDir . '/manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
    }

    /**
     * Write a skill file to the project's .skillr/skills/ directory.
     * Uses folder format ({slug}/skill.md + gotchas.md) when the skill has gotchas
     * or supplementary files. Otherwise uses flat format ({slug}.md).
     */
    public function writeSkillFile(string $projectPath, array $frontmatter, string $body, ?string $gotchas = null, array $supplementaryFiles = []): void
    {
        $slug = $frontmatter['id'] ?? \Illuminate\Support\Str::slug($frontmatter['name'] ?? 'untitled');
        $skillsDir = rtrim($projectPath, '/') . '/.skillr/skills';
        $useFolderFormat = ! empty($gotchas) || ! empty($supplementaryFiles);

        File::ensureDirectoryExists($skillsDir);

        if ($useFolderFormat) {
            // Remove flat file if it exists (upgrading to folder format)
            $flatFile = $skillsDir . '/' . $slug . '.md';
            if (File::exists($flatFile)) {
                File::delete($flatFile);
            }

            $skillDir = $skillsDir . '/' . $slug;
            File::ensureDirectoryExists($skillDir);

            // Write main skill.md
            File::put($skillDir . '/skill.md', $this->parser->renderFile($frontmatter, $body));

            // Write gotchas.md
            if (! empty($gotchas)) {
                File::put($skillDir . '/gotchas.md', $gotchas);
            } elseif (File::exists($skillDir . '/gotchas.md')) {
                File::delete($skillDir . '/gotchas.md');
            }

            // Write supplementary files
            foreach ($supplementaryFiles as $file) {
                $filePath = $skillDir . '/' . $file['path'];
                File::ensureDirectoryExists(dirname($filePath));
                File::put($filePath, $file['content']);
            }
        } else {
            // Remove folder if it exists (downgrading to flat format)
            $folderPath = $skillsDir . '/' . $slug;
            if (File::isDirectory($folderPath)) {
                File::deleteDirectory($folderPath);
            }

            File::put($skillsDir . '/' . $slug . '.md', $this->parser->renderFile($frontmatter, $body));
        }
    }

    /**
     * Delete a skill file from the project's .skillr/skills/ directory.
     * Handles both flat files and folder-based skills.
     */
    public function deleteSkillFile(string $projectPath, string $slug): void
    {
        $skillsDir = rtrim($projectPath, '/') . '/.skillr/skills';

        // Delete flat file
        $file = $skillsDir . '/' . $slug . '.md';
        if (File::exists($file)) {
            File::delete($file);
        }

        // Delete folder
        $folder = $skillsDir . '/' . $slug;
        if (File::isDirectory($folder)) {
            File::deleteDirectory($folder);
        }
    }

    /**
     * Check if a skill file exists in the project's .skillr/skills/ directory.
     * Checks both flat file and folder format.
     */
    public function skillExists(string $projectPath, string $slug): bool
    {
        $skillsDir = rtrim($projectPath, '/') . '/.skillr/skills';

        return File::exists($skillsDir . '/' . $slug . '.md')
            || File::exists($skillsDir . '/' . $slug . '/skill.md');
    }
}
