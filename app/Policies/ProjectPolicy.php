<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Project $project): bool
    {
        return $this->belongsToUserOrganization($user, $project);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Project $project): bool
    {
        return $this->belongsToUserOrganization($user, $project);
    }

    public function delete(User $user, Project $project): bool
    {
        return $this->belongsToUserOrganization($user, $project);
    }

    protected function belongsToUserOrganization(User $user, Project $project): bool
    {
        // If no org context, allow (single-user mode / no multi-tenancy configured)
        if (! $user->current_organization_id && ! $project->organization_id) {
            return true;
        }

        return $project->organization_id === $user->current_organization_id;
    }
}
