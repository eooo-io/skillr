<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DesktopAppConfig extends Model
{
    protected $fillable = [
        'user_id',
        'app_slug',
        'config_path',
        'sync_mcp',
        'sync_settings',
        'managed_keys',
        'last_synced_at',
    ];

    protected function casts(): array
    {
        return [
            'sync_mcp' => 'boolean',
            'sync_settings' => 'boolean',
            'managed_keys' => 'array',
            'last_synced_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Known desktop app definitions with default config paths.
     */
    public static function knownApps(): array
    {
        $home = PHP_OS_FAMILY === 'Windows'
            ? getenv('USERPROFILE')
            : getenv('HOME');

        return [
            'claude-desktop' => [
                'name' => 'Claude Desktop',
                'config_path' => match (PHP_OS_FAMILY) {
                    'Darwin' => "{$home}/Library/Application Support/Claude/claude_desktop_config.json",
                    'Windows' => "{$home}/AppData/Roaming/Claude/claude_desktop_config.json",
                    default => "{$home}/.config/claude/claude_desktop_config.json",
                },
                'supports' => ['mcp'],
            ],
            'claude-code' => [
                'name' => 'Claude Code',
                'config_path' => "{$home}/.claude/settings.json",
                'supports' => ['mcp', 'settings'],
            ],
            'cursor' => [
                'name' => 'Cursor',
                'config_path' => "{$home}/.cursor/mcp.json",
                'supports' => ['mcp'],
            ],
            'windsurf' => [
                'name' => 'Windsurf',
                'config_path' => "{$home}/.windsurf/mcp.json",
                'supports' => ['mcp'],
            ],
            'codex-cli' => [
                'name' => 'Codex CLI',
                'config_path' => "{$home}/.codex/config.json",
                'supports' => ['settings'],
            ],
        ];
    }

    /**
     * Detect which known apps have config files present on this machine.
     */
    public static function detectInstalled(): array
    {
        $detected = [];

        foreach (self::knownApps() as $slug => $app) {
            $detected[$slug] = array_merge($app, [
                'slug' => $slug,
                'installed' => file_exists($app['config_path']),
            ]);
        }

        return $detected;
    }
}
