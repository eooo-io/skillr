<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Skill;
use App\Models\Tag;
use Illuminate\Support\Str;

class ProjectScanService
{
    public function __construct(
        protected SkillrManifestService $manifestService,
        protected ProviderImportService $importService,
    ) {}

    /**
     * Scan a project directory for skills from .skillr/ and all provider configs.
     */
    public function scan(Project $project): array
    {
        $path = $project->resolved_path;

        // Phase 1: Scan .skillr/skills/
        $skillrResult = $this->scanSkillrDirectory($project, $path);

        // Phase 2: Auto-detect and import from provider config files
        $providerResult = $this->importFromProviders($project, $path);

        $project->update(['synced_at' => now()]);

        return [
            'skillr' => $skillrResult,
            'providers' => $providerResult,
            'total_skills' => $project->skills()->count(),
        ];
    }

    /**
     * Scan .skillr/skills/ directory — existing behavior from ProjectScanJob.
     */
    protected function scanSkillrDirectory(Project $project, string $path): array
    {
        $result = $this->manifestService->scanProject($path);

        $found = count($result['skills']);
        $created = 0;
        $updated = 0;

        foreach ($result['skills'] as $parsedSkill) {
            $frontmatter = $parsedSkill['frontmatter'];
            $body = $parsedSkill['body'];
            $slug = $frontmatter['id'] ?? $parsedSkill['filename'];

            $existing = $project->skills()->where('slug', $slug)->first();

            $skill = Skill::updateOrCreate(
                [
                    'project_id' => $project->id,
                    'slug' => $slug,
                ],
                [
                    'name' => $frontmatter['name'] ?? Str::headline($slug),
                    'description' => $frontmatter['description'] ?? null,
                    'model' => $frontmatter['model'] ?? null,
                    'max_tokens' => $frontmatter['max_tokens'] ?? null,
                    'tools' => $frontmatter['tools'] ?? null,
                    'includes' => $frontmatter['includes'] ?? null,
                    'template_variables' => $frontmatter['template_variables'] ?? null,
                    'body' => $body,
                ],
            );

            if ($existing) {
                $updated++;
            } else {
                $created++;
            }

            if (! empty($frontmatter['tags']) && is_array($frontmatter['tags'])) {
                $tagIds = collect($frontmatter['tags'])->map(function (string $tagName) {
                    return Tag::firstOrCreate(['name' => trim($tagName)])->id;
                });

                $skill->tags()->sync($tagIds);
            }

            if ($skill->versions()->count() === 0) {
                $skill->versions()->create([
                    'version_number' => 1,
                    'frontmatter' => $frontmatter,
                    'body' => $body,
                    'note' => 'Initial scan',
                    'saved_at' => now(),
                ]);
            }
        }

        return [
            'found' => $found,
            'created' => $created,
            'updated' => $updated,
        ];
    }

    /**
     * Detect and import skills from all provider config files.
     */
    protected function importFromProviders(Project $project, string $path): array
    {
        $detected = $this->importService->detect($path);

        if (empty($detected)) {
            return [
                'detected' => [],
                'imported' => 0,
                'skipped' => 0,
            ];
        }

        $result = $this->importService->import($project, $detected);

        $detectedCounts = [];
        foreach ($detected as $provider => $skills) {
            $detectedCounts[$provider] = count($skills);
        }

        return [
            'detected' => $detectedCounts,
            'imported' => $result['created'],
            'skipped' => $result['skipped'],
        ];
    }
}
