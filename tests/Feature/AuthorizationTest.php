<?php

use App\Models\Organization;
use App\Models\Project;
use App\Models\Skill;
use App\Models\User;
use App\Models\Webhook;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    // Create two organizations with separate users
    $this->orgA = Organization::create(['name' => 'Org A', 'slug' => 'org-a', 'plan' => 'free']);
    $this->orgB = Organization::create(['name' => 'Org B', 'slug' => 'org-b', 'plan' => 'free']);

    $this->userA = User::factory()->create(['current_organization_id' => $this->orgA->id]);
    $this->userB = User::factory()->create(['current_organization_id' => $this->orgB->id]);

    $this->orgA->users()->attach($this->userA, ['role' => 'owner']);
    $this->orgB->users()->attach($this->userB, ['role' => 'owner']);

    // Bind org context for project creation
    app()->instance('current_organization', $this->orgA);
    $this->projectA = Project::create([
        'name' => 'Project A',
        'path' => '/tmp/project-a',
        'organization_id' => $this->orgA->id,
    ]);

    $this->skillA = $this->projectA->skills()->create([
        'name' => 'Skill A',
        'slug' => 'skill-a',
        'body' => 'Test body',
    ]);

    app()->instance('current_organization', $this->orgB);
    $this->projectB = Project::create([
        'name' => 'Project B',
        'path' => '/tmp/project-b',
        'organization_id' => $this->orgB->id,
    ]);

    $this->skillB = $this->projectB->skills()->create([
        'name' => 'Skill B',
        'slug' => 'skill-b',
        'body' => 'Test body B',
    ]);
});

// ─── Project Authorization ──────────────────────────────────

it('allows user to view their own project', function () {
    $this->actingAs($this->userA)
        ->getJson("/api/projects/{$this->projectA->id}")
        ->assertOk();
});

it('denies user from viewing another org project', function () {
    $this->actingAs($this->userA)
        ->getJson("/api/projects/{$this->projectB->id}")
        ->assertForbidden();
});

it('denies user from updating another org project', function () {
    $this->actingAs($this->userA)
        ->putJson("/api/projects/{$this->projectB->id}", ['name' => 'Hacked'])
        ->assertForbidden();
});

it('denies user from deleting another org project', function () {
    $this->actingAs($this->userA)
        ->deleteJson("/api/projects/{$this->projectB->id}")
        ->assertForbidden();
});

// ─── Skill Authorization ────────────────────────────────────

it('allows user to view their own skill', function () {
    $this->actingAs($this->userA)
        ->getJson("/api/skills/{$this->skillA->id}")
        ->assertOk();
});

it('denies user from viewing another org skill', function () {
    $this->actingAs($this->userA)
        ->getJson("/api/skills/{$this->skillB->id}")
        ->assertForbidden();
});

it('denies user from updating another org skill', function () {
    $this->actingAs($this->userA)
        ->putJson("/api/skills/{$this->skillB->id}", ['name' => 'Hacked'])
        ->assertForbidden();
});

it('denies user from deleting another org skill', function () {
    $this->actingAs($this->userA)
        ->deleteJson("/api/skills/{$this->skillB->id}")
        ->assertForbidden();
});

// ─── Skill Duplication Cross-Project ────────────────────────

it('denies duplicating a skill into another org project', function () {
    $this->actingAs($this->userA)
        ->postJson("/api/skills/{$this->skillA->id}/duplicate", [
            'target_project_id' => $this->projectB->id,
        ])
        ->assertForbidden();
});

// ─── Bulk Operations ────────────────────────────────────────

it('filters out other org skills in bulk delete', function () {
    $this->actingAs($this->userA)
        ->postJson('/api/skills/bulk-delete', [
            'skill_ids' => [$this->skillA->id, $this->skillB->id],
        ])
        ->assertOk();

    // Only skill A should be deleted (owned by user A's org)
    expect(Skill::find($this->skillA->id))->toBeNull();
    expect(Skill::find($this->skillB->id))->not->toBeNull();
});

it('denies bulk move to another org project', function () {
    $this->actingAs($this->userA)
        ->postJson('/api/skills/bulk-move', [
            'skill_ids' => [$this->skillA->id],
            'target_project_id' => $this->projectB->id,
        ])
        ->assertForbidden();
});

// ─── Unauthenticated Access ─────────────────────────────────

it('returns 401 for unauthenticated requests', function () {
    $this->getJson('/api/projects')
        ->assertUnauthorized();
});
