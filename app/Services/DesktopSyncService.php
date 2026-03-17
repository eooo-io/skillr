<?php

namespace App\Services;

use App\Models\DesktopAppConfig;
use App\Models\ProjectMcpServer;
use App\Models\User;
use App\Models\WorkspaceProfile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;

class DesktopSyncService
{
    /**
     * Sync MCP servers and/or settings to all registered desktop apps for a user.
     */
    public function syncAll(User $user, ?int $projectId = null): array
    {
        $configs = DesktopAppConfig::where('user_id', $user->id)->get();
        $results = [];

        foreach ($configs as $config) {
            $results[$config->app_slug] = $this->syncApp($config, $user, $projectId);
        }

        return $results;
    }

    /**
     * Sync MCP servers and/or settings to a specific desktop app.
     */
    public function syncApp(DesktopAppConfig $config, User $user, ?int $projectId = null): array
    {
        $result = ['app' => $config->app_slug, 'mcp_synced' => false, 'settings_synced' => false, 'error' => null];

        try {
            $existing = $this->readConfigFile($config->config_path);

            if ($config->sync_mcp) {
                $servers = $this->getMcpServers($user, $projectId);
                $existing = $this->mergeMcpServers($existing, $servers, $config->app_slug);
                $result['mcp_synced'] = true;
            }

            if ($config->sync_settings) {
                $profile = WorkspaceProfile::where('user_id', $user->id)
                    ->where('is_default', true)
                    ->first();

                if ($profile) {
                    $existing = $this->mergeSettings($existing, $profile, $config->app_slug);
                    $result['settings_synced'] = true;
                }
            }

            $this->writeConfigFile($config->config_path, $existing);
            $config->update(['last_synced_at' => now()]);
        } catch (\Throwable $e) {
            $result['error'] = $e->getMessage();
        }

        return $result;
    }

    /**
     * Generate a preview of what would be written without actually writing.
     */
    public function preview(DesktopAppConfig $config, User $user, ?int $projectId = null): array
    {
        $current = $this->readConfigFile($config->config_path);
        $proposed = $current;

        if ($config->sync_mcp) {
            $servers = $this->getMcpServers($user, $projectId);
            $proposed = $this->mergeMcpServers($proposed, $servers, $config->app_slug);
        }

        if ($config->sync_settings) {
            $profile = WorkspaceProfile::where('user_id', $user->id)
                ->where('is_default', true)
                ->first();

            if ($profile) {
                $proposed = $this->mergeSettings($proposed, $profile, $config->app_slug);
            }
        }

        return [
            'current' => json_encode($current, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
            'proposed' => json_encode($proposed, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
        ];
    }

    /**
     * Detect and import MCP servers from existing desktop config files.
     */
    public function importMcpServers(User $user, int $projectId): array
    {
        $imported = 0;
        $skipped = 0;
        $sources = [];

        $knownApps = DesktopAppConfig::knownApps();

        foreach ($knownApps as $slug => $app) {
            if (! in_array('mcp', $app['supports'])) {
                continue;
            }

            if (! file_exists($app['config_path'])) {
                continue;
            }

            $config = $this->readConfigFile($app['config_path']);
            $mcpServers = $config['mcpServers'] ?? [];

            if (empty($mcpServers)) {
                continue;
            }

            foreach ($mcpServers as $name => $entry) {
                $exists = ProjectMcpServer::where('project_id', $projectId)
                    ->where('name', $name)
                    ->exists();

                if ($exists) {
                    $skipped++;

                    continue;
                }

                $transport = isset($entry['command']) ? 'stdio' : 'sse';

                ProjectMcpServer::create([
                    'project_id' => $projectId,
                    'name' => $name,
                    'transport' => $transport,
                    'command' => $entry['command'] ?? null,
                    'args' => $entry['args'] ?? null,
                    'url' => $entry['url'] ?? null,
                    'env' => $entry['env'] ?? null,
                    'headers' => $entry['headers'] ?? null,
                    'enabled' => true,
                ]);

                $imported++;
            }

            if (! empty($mcpServers)) {
                $sources[$slug] = count($mcpServers);
            }
        }

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'sources' => $sources,
        ];
    }

    /**
     * Get all enabled MCP servers for the user, optionally scoped to a project.
     */
    protected function getMcpServers(User $user, ?int $projectId): Collection
    {
        $query = ProjectMcpServer::where('enabled', true);

        if ($projectId) {
            $query->where('project_id', $projectId);
        } else {
            // All projects in the user's current organization
            $query->whereHas('project', function ($q) use ($user) {
                if ($user->current_organization_id) {
                    $q->where('organization_id', $user->current_organization_id);
                }
            });
        }

        return $query->get();
    }

    /**
     * Build the mcpServers JSON object from server models.
     */
    protected function buildMcpServersJson(Collection $servers): array
    {
        $mcpServers = [];

        foreach ($servers as $server) {
            $entry = [];

            if ($server->transport === 'stdio') {
                if ($server->command) {
                    $entry['command'] = $server->command;
                }
                if (! empty($server->args)) {
                    $entry['args'] = $server->args;
                }
            } else {
                if ($server->url) {
                    $entry['url'] = $server->url;
                }
                if (! empty($server->headers)) {
                    $entry['headers'] = $server->headers;
                }
            }

            if (! empty($server->env)) {
                $entry['env'] = $server->env;
            }

            $mcpServers[$server->name] = $entry;
        }

        return $mcpServers;
    }

    /**
     * Merge MCP servers into an existing config, preserving non-MCP keys.
     */
    protected function mergeMcpServers(array $config, Collection $servers, string $appSlug): array
    {
        $mcpServers = $this->buildMcpServersJson($servers);

        // Each app stores mcpServers at the same key, just different file locations
        $config['mcpServers'] = $mcpServers;

        return $config;
    }

    /**
     * Merge workspace profile settings into a config for a specific app.
     */
    protected function mergeSettings(array $config, WorkspaceProfile $profile, string $appSlug): array
    {
        return match ($appSlug) {
            'claude-code' => $this->mergeClaudeCodeSettings($config, $profile),
            'codex-cli' => $this->mergeCodexSettings($config, $profile),
            default => $config,
        };
    }

    protected function mergeClaudeCodeSettings(array $config, WorkspaceProfile $profile): array
    {
        if ($profile->allowed_tools) {
            $config['allowedTools'] = $profile->allowed_tools;
        }

        if ($profile->denied_tools) {
            $config['deniedTools'] = $profile->denied_tools;
        }

        return $config;
    }

    protected function mergeCodexSettings(array $config, WorkspaceProfile $profile): array
    {
        if ($profile->default_model) {
            $config['model'] = $profile->default_model;
        }

        if ($profile->approval_mode) {
            $config['approvalMode'] = $profile->approval_mode;
        }

        return $config;
    }

    protected function readConfigFile(string $path): array
    {
        if (! file_exists($path)) {
            return [];
        }

        $content = file_get_contents($path);
        $decoded = json_decode($content, true);

        return is_array($decoded) ? $decoded : [];
    }

    protected function writeConfigFile(string $path, array $config): void
    {
        $dir = dirname($path);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        file_put_contents(
            $path,
            json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n",
        );
    }
}
