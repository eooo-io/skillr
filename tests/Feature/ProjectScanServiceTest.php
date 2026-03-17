<?php

use App\Models\Organization;
use App\Models\Project;
use App\Models\User;
use App\Services\ProjectScanService;
use Illuminate\Support\Facades\File;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->org = Organization::create(['name' => 'Test Org', 'slug' => 'test-org', 'plan' => 'free']);
    $this->user = User::factory()->create(['current_organization_id' => $this->org->id]);
    $this->org->users()->attach($this->user, ['role' => 'owner']);
    app()->instance('current_organization', $this->org);

    $this->tempDir = sys_get_temp_dir() . '/skillr-scan-test-' . uniqid();
    mkdir($this->tempDir, 0755, true);

    $this->project = Project::create([
        'name' => 'Scan Test',
        'path' => $this->tempDir,
        'organization_id' => $this->org->id,
    ]);

    $this->scanService = app(ProjectScanService::class);
});

afterEach(function () {
    File::deleteDirectory($this->tempDir);
});

it('scans .skillr/skills/ directory and creates skills', function () {
    // Create a .skillr/skills/ structure
    mkdir($this->tempDir . '/.skillr/skills', 0755, true);
    file_put_contents($this->tempDir . '/.skillr/skills/test-skill.md', <<<'MD'
---
id: test-skill
name: Test Skill
description: A test skill
tags: [testing]
---

You are a test helper.
MD);

    $result = $this->scanService->scan($this->project);

    expect($result['skillr']['found'])->toBe(1);
    expect($result['skillr']['created'])->toBe(1);
    expect($result['total_skills'])->toBe(1);

    $skill = $this->project->skills()->where('slug', 'test-skill')->first();
    expect($skill)->not->toBeNull();
    expect($skill->name)->toBe('Test Skill');
});

it('auto-imports from Claude CLAUDE.md', function () {
    mkdir($this->tempDir . '/.claude', 0755, true);
    file_put_contents($this->tempDir . '/.claude/CLAUDE.md', <<<'MD'
# Project Instructions

## Code Style

Always use snake_case for variable names.

## Testing

Write tests for all public methods.
MD);

    $result = $this->scanService->scan($this->project);

    expect($result['providers']['detected'])->toHaveKey('claude');
    expect($result['providers']['imported'])->toBe(2);

    $codeStyle = $this->project->skills()->where('slug', 'code-style')->first();
    expect($codeStyle)->not->toBeNull();
    expect($codeStyle->body)->toContain('snake_case');

    // Verify imported:claude tag
    expect($codeStyle->tags->pluck('name')->toArray())->toContain('imported:claude');
});

it('auto-imports from Cursor .mdc files', function () {
    mkdir($this->tempDir . '/.cursor/rules', 0755, true);
    file_put_contents($this->tempDir . '/.cursor/rules/lint-rules.mdc', <<<'MD'
---
description: Linting configuration
tags: [linting, quality]
---

Always run the linter before committing.
MD);

    $result = $this->scanService->scan($this->project);

    expect($result['providers']['detected'])->toHaveKey('cursor');
    expect($result['providers']['imported'])->toBe(1);

    $skill = $this->project->skills()->where('slug', 'lint-rules')->first();
    expect($skill)->not->toBeNull();
    expect($skill->tags->pluck('name')->toArray())->toContain('imported:cursor');
    expect($skill->tags->pluck('name')->toArray())->toContain('linting');
});

it('skips duplicate slugs from provider configs', function () {
    // Pre-create a skill with the same slug
    $this->project->skills()->create([
        'name' => 'Code Style',
        'slug' => 'code-style',
        'body' => 'Existing skill',
    ]);

    mkdir($this->tempDir . '/.claude', 0755, true);
    file_put_contents($this->tempDir . '/.claude/CLAUDE.md', <<<'MD'
## Code Style

New instructions from Claude.
MD);

    $result = $this->scanService->scan($this->project);

    expect($result['providers']['skipped'])->toBe(1);
    expect($result['providers']['imported'])->toBe(0);

    // Original skill body should be unchanged
    $skill = $this->project->skills()->where('slug', 'code-style')->first();
    expect($skill->body)->toBe('Existing skill');
});

it('detects Codex CLI AGENTS.md', function () {
    file_put_contents($this->tempDir . '/AGENTS.md', <<<'MD'
## Frontend Agent

Handle all React component development.

## Backend Agent

Handle all API endpoint development.
MD);

    $result = $this->scanService->scan($this->project);

    expect($result['providers']['detected'])->toHaveKey('codex');
    expect($result['providers']['imported'])->toBe(2);

    $skill = $this->project->skills()->where('slug', 'frontend-agent')->first();
    expect($skill)->not->toBeNull();
    expect($skill->tags->pluck('name')->toArray())->toContain('imported:codex');
});

it('scans multiple providers in a single scan', function () {
    // Claude
    mkdir($this->tempDir . '/.claude', 0755, true);
    file_put_contents($this->tempDir . '/.claude/CLAUDE.md', "## Claude Skill\n\nClaude instructions.");

    // Cursor
    mkdir($this->tempDir . '/.cursor/rules', 0755, true);
    file_put_contents($this->tempDir . '/.cursor/rules/cursor-skill.mdc', "---\n---\n\nCursor instructions.");

    // OpenAI
    mkdir($this->tempDir . '/.openai', 0755, true);
    file_put_contents($this->tempDir . '/.openai/instructions.md', "## OpenAI Skill\n\nOpenAI instructions.");

    $result = $this->scanService->scan($this->project);

    expect($result['providers']['detected'])->toHaveKey('claude');
    expect($result['providers']['detected'])->toHaveKey('cursor');
    expect($result['providers']['detected'])->toHaveKey('openai');
    expect($result['providers']['imported'])->toBe(3);
    expect($result['total_skills'])->toBe(3);
});

it('returns zero results when directory is empty', function () {
    $result = $this->scanService->scan($this->project);

    expect($result['skillr']['found'])->toBe(0);
    expect($result['providers']['detected'])->toBeEmpty();
    expect($result['providers']['imported'])->toBe(0);
    expect($result['total_skills'])->toBe(0);
});

it('creates version snapshots for imported skills', function () {
    mkdir($this->tempDir . '/.claude', 0755, true);
    file_put_contents($this->tempDir . '/.claude/CLAUDE.md', "## My Skill\n\nSome instructions.");

    $this->scanService->scan($this->project);

    $skill = $this->project->skills()->where('slug', 'my-skill')->first();
    expect($skill->versions()->count())->toBe(1);
    expect($skill->versions()->first()->note)->toBe('Imported from claude');
});
