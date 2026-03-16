<?php

namespace App\Policies;

use App\Models\ProjectA2aAgent;
use App\Models\User;

class ProjectA2aAgentPolicy
{
    public function view(User $user, ProjectA2aAgent $a2aAgent): bool
    {
        return $this->belongsToUserOrganization($user, $a2aAgent);
    }

    public function update(User $user, ProjectA2aAgent $a2aAgent): bool
    {
        return $this->belongsToUserOrganization($user, $a2aAgent);
    }

    public function delete(User $user, ProjectA2aAgent $a2aAgent): bool
    {
        return $this->belongsToUserOrganization($user, $a2aAgent);
    }

    protected function belongsToUserOrganization(User $user, ProjectA2aAgent $a2aAgent): bool
    {
        $orgId = $a2aAgent->project?->organization_id;

        if (! $user->current_organization_id && ! $orgId) {
            return true;
        }

        return $orgId === $user->current_organization_id;
    }
}
