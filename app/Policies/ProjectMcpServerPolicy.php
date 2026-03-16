<?php

namespace App\Policies;

use App\Models\ProjectMcpServer;
use App\Models\User;

class ProjectMcpServerPolicy
{
    public function view(User $user, ProjectMcpServer $mcpServer): bool
    {
        return $this->belongsToUserOrganization($user, $mcpServer);
    }

    public function update(User $user, ProjectMcpServer $mcpServer): bool
    {
        return $this->belongsToUserOrganization($user, $mcpServer);
    }

    public function delete(User $user, ProjectMcpServer $mcpServer): bool
    {
        return $this->belongsToUserOrganization($user, $mcpServer);
    }

    protected function belongsToUserOrganization(User $user, ProjectMcpServer $mcpServer): bool
    {
        $orgId = $mcpServer->project?->organization_id;

        if (! $user->current_organization_id && ! $orgId) {
            return true;
        }

        return $orgId === $user->current_organization_id;
    }
}
