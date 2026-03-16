<?php

namespace App\Policies;

use App\Models\Skill;
use App\Models\User;

class SkillPolicy
{
    public function view(User $user, Skill $skill): bool
    {
        return $this->belongsToUserOrganization($user, $skill);
    }

    public function update(User $user, Skill $skill): bool
    {
        return $this->belongsToUserOrganization($user, $skill);
    }

    public function delete(User $user, Skill $skill): bool
    {
        return $this->belongsToUserOrganization($user, $skill);
    }

    protected function belongsToUserOrganization(User $user, Skill $skill): bool
    {
        $orgId = $skill->project?->organization_id;

        if (! $user->current_organization_id && ! $orgId) {
            return true;
        }

        return $orgId === $user->current_organization_id;
    }
}
