<?php

use App\Models\Organization;
use App\Models\Project;
use App\Models\User;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->org = Organization::create(['name' => 'Test Org', 'slug' => 'test-org', 'plan' => 'free']);
    $this->user = User::factory()->create(['current_organization_id' => $this->org->id]);
    $this->org->users()->attach($this->user, ['role' => 'owner']);
    app()->instance('current_organization', $this->org);
});

it('lists projects for the current organization', function () {
    Project::create(['name' => 'Project 1', 'path' => '/tmp/p1', 'organization_id' => $this->org->id]);
    Project::create(['name' => 'Project 2', 'path' => '/tmp/p2', 'organization_id' => $this->org->id]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/projects')
        ->assertOk();

    expect($response->json('data'))->toHaveCount(2);
});

it('creates a project', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/projects', [
            'name' => 'New Project',
            'path' => '/tmp/new-project',
        ])
        ->assertCreated();

    expect($response->json('data.name'))->toBe('New Project');
    expect(Project::where('name', 'New Project')->exists())->toBeTrue();
});

it('shows a single project', function () {
    $project = Project::create(['name' => 'Show Me', 'path' => '/tmp/show', 'organization_id' => $this->org->id]);

    $this->actingAs($this->user)
        ->getJson("/api/projects/{$project->id}")
        ->assertOk()
        ->assertJsonPath('data.name', 'Show Me');
});

it('updates a project', function () {
    $project = Project::create(['name' => 'Old Name', 'path' => '/tmp/old', 'organization_id' => $this->org->id]);

    $this->actingAs($this->user)
        ->putJson("/api/projects/{$project->id}", ['name' => 'New Name'])
        ->assertOk()
        ->assertJsonPath('data.name', 'New Name');
});

it('deletes a project', function () {
    $project = Project::create(['name' => 'Delete Me', 'path' => '/tmp/del', 'organization_id' => $this->org->id]);

    $this->actingAs($this->user)
        ->deleteJson("/api/projects/{$project->id}")
        ->assertOk();

    expect(Project::find($project->id))->toBeNull();
});

it('validates required fields on create', function () {
    $this->actingAs($this->user)
        ->postJson('/api/projects', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'path']);
});
