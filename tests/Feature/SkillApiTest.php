<?php

use App\Models\Organization;
use App\Models\Project;
use App\Models\Skill;
use App\Models\User;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->org = Organization::create(['name' => 'Test Org', 'slug' => 'test-org', 'plan' => 'free']);
    $this->user = User::factory()->create(['current_organization_id' => $this->org->id]);
    $this->org->users()->attach($this->user, ['role' => 'owner']);
    app()->instance('current_organization', $this->org);

    $this->project = Project::create([
        'name' => 'Test Project',
        'path' => sys_get_temp_dir() . '/skillr-test-' . uniqid(),
        'organization_id' => $this->org->id,
    ]);
});

it('lists skills for a project', function () {
    $this->project->skills()->create(['name' => 'Skill 1', 'slug' => 'skill-1', 'body' => '']);
    $this->project->skills()->create(['name' => 'Skill 2', 'slug' => 'skill-2', 'body' => '']);

    $response = $this->actingAs($this->user)
        ->getJson("/api/projects/{$this->project->id}/skills")
        ->assertOk();

    expect($response->json('data'))->toHaveCount(2);
});

it('creates a skill', function () {
    $response = $this->actingAs($this->user)
        ->postJson("/api/projects/{$this->project->id}/skills", [
            'name' => 'New Skill',
            'body' => 'You are a helpful assistant.',
        ])
        ->assertCreated();

    expect($response->json('data.name'))->toBe('New Skill');
    expect($response->json('data.slug'))->toBe('new-skill');
});

it('shows a skill', function () {
    $skill = $this->project->skills()->create(['name' => 'Show Me', 'slug' => 'show-me', 'body' => 'Test']);

    $this->actingAs($this->user)
        ->getJson("/api/skills/{$skill->id}")
        ->assertOk()
        ->assertJsonPath('data.name', 'Show Me');
});

it('updates a skill', function () {
    $skill = $this->project->skills()->create(['name' => 'Old', 'slug' => 'old', 'body' => 'Old body']);

    $this->actingAs($this->user)
        ->putJson("/api/skills/{$skill->id}", [
            'name' => 'Updated',
            'body' => 'Updated body',
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Updated');
});

it('deletes a skill', function () {
    $skill = $this->project->skills()->create(['name' => 'Delete Me', 'slug' => 'delete-me', 'body' => '']);

    $this->actingAs($this->user)
        ->deleteJson("/api/skills/{$skill->id}")
        ->assertOk();

    expect(Skill::find($skill->id))->toBeNull();
});

it('duplicates a skill within the same project', function () {
    $skill = $this->project->skills()->create(['name' => 'Original', 'slug' => 'original', 'body' => 'Content']);

    $response = $this->actingAs($this->user)
        ->postJson("/api/skills/{$skill->id}/duplicate")
        ->assertOk();

    expect($response->json('data.name'))->toBe('Original (Copy)');
    expect($this->project->skills()->count())->toBe(2);
});

it('auto-generates unique slugs', function () {
    $this->project->skills()->create(['name' => 'Test Skill', 'slug' => 'test-skill', 'body' => '']);

    $response = $this->actingAs($this->user)
        ->postJson("/api/projects/{$this->project->id}/skills", [
            'name' => 'Test Skill',
            'body' => 'Different body',
        ])
        ->assertCreated();

    expect($response->json('data.slug'))->toBe('test-skill-1');
});

it('creates a version snapshot on save', function () {
    $skill = $this->project->skills()->create(['name' => 'Versioned', 'slug' => 'versioned', 'body' => 'v1']);

    // The store method creates a version — let's trigger an update
    $this->actingAs($this->user)
        ->putJson("/api/skills/{$skill->id}", ['body' => 'v2']);

    $versions = $skill->versions()->get();
    expect($versions)->not->toBeEmpty();
});

it('validates required fields on create', function () {
    $this->actingAs($this->user)
        ->postJson("/api/projects/{$this->project->id}/skills", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});
