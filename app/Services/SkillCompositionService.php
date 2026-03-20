<?php

namespace App\Services;

use App\Models\Skill;

class SkillCompositionService
{
    protected const MAX_DEPTH = 5;

    /**
     * Resolve a skill's full body by prepending included skill bodies.
     *
     * @param  string[]  $visited  Slugs already visited (for circular detection)
     */
    public function resolve(Skill $skill, array $visited = [], int $depth = 0): string
    {
        if ($depth > self::MAX_DEPTH) {
            return "<!-- Include depth limit exceeded -->\n\n" . ($skill->body ?? '');
        }

        $includes = $skill->includes ?? [];

        if (empty($includes)) {
            return $skill->body ?? '';
        }

        $visited[] = $skill->slug;
        $sections = [];

        foreach ($includes as $slug) {
            if (in_array($slug, $visited)) {
                $sections[] = "<!-- Circular include skipped: {$slug} -->";
                continue;
            }

            $included = Skill::where('project_id', $skill->project_id)
                ->where('slug', $slug)
                ->first();

            if (! $included) {
                $sections[] = "<!-- Include not found: {$slug} -->";
                continue;
            }

            $sections[] = $this->resolve($included, $visited, $depth + 1);
        }

        // Prepend included content, then the skill's own body
        $sections[] = $skill->body ?? '';

        return implode("\n\n", array_filter($sections));
    }

    /**
     * Resolve a skill at a specific progressive disclosure level.
     *
     * Level 1: Name + description (~100 tokens, for agent discovery)
     * Level 2: Full resolved body (standard compose behavior)
     * Level 3: Body + gotchas + supplementary files (deep context)
     */
    public function resolveAtLevel(Skill $skill, int $level = 2): string
    {
        return match ($level) {
            1 => "{$skill->name}: " . ($skill->description ?? 'No description'),
            3 => $this->resolveLevel3($skill),
            default => $this->resolve($skill),
        };
    }

    protected function resolveLevel3(Skill $skill): string
    {
        $sections = [$this->resolve($skill)];

        if (! empty($skill->gotchas)) {
            $sections[] = "## Common Gotchas\n\n{$skill->gotchas}";
        }

        foreach ($skill->supplementary_files ?? [] as $file) {
            $path = $file['path'] ?? 'unknown';
            $content = $file['content'] ?? '';
            if (! empty($content)) {
                $sections[] = "## {$path}\n\n{$content}";
            }
        }

        return implode("\n\n", array_filter($sections));
    }

    /**
     * Validate includes for a skill and return errors.
     *
     * @return string[]
     */
    public function validateIncludes(Skill $skill): array
    {
        $errors = [];
        $includes = $skill->includes ?? [];

        foreach ($includes as $slug) {
            if ($slug === $skill->slug) {
                $errors[] = "Skill cannot include itself: {$slug}";
                continue;
            }

            $exists = Skill::where('project_id', $skill->project_id)
                ->where('slug', $slug)
                ->exists();

            if (! $exists) {
                $errors[] = "Included skill not found: {$slug}";
            }
        }

        // Check for circular dependencies
        if (empty($errors)) {
            $this->detectCycles($skill, [$skill->slug], $errors);
        }

        return $errors;
    }

    protected function detectCycles(Skill $skill, array $path, array &$errors, int $depth = 0): void
    {
        if ($depth > self::MAX_DEPTH) {
            return;
        }

        foreach ($skill->includes ?? [] as $slug) {
            if (in_array($slug, $path)) {
                $cycle = implode(' -> ', [...$path, $slug]);
                $errors[] = "Circular dependency detected: {$cycle}";
                continue;
            }

            $included = Skill::where('project_id', $skill->project_id)
                ->where('slug', $slug)
                ->first();

            if ($included && ! empty($included->includes)) {
                $this->detectCycles($included, [...$path, $slug], $errors, $depth + 1);
            }
        }
    }
}
