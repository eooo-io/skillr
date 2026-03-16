<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Webhook;

class WebhookPolicy
{
    public function view(User $user, Webhook $webhook): bool
    {
        return $this->belongsToUserOrganization($user, $webhook);
    }

    public function update(User $user, Webhook $webhook): bool
    {
        return $this->belongsToUserOrganization($user, $webhook);
    }

    public function delete(User $user, Webhook $webhook): bool
    {
        return $this->belongsToUserOrganization($user, $webhook);
    }

    protected function belongsToUserOrganization(User $user, Webhook $webhook): bool
    {
        $orgId = $webhook->project?->organization_id;

        if (! $user->current_organization_id && ! $orgId) {
            return true;
        }

        return $orgId === $user->current_organization_id;
    }
}
