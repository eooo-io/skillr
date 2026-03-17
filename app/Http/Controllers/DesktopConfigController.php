<?php

namespace App\Http\Controllers;

use App\Models\DesktopAppConfig;
use App\Services\DesktopSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DesktopConfigController extends Controller
{
    public function __construct(
        protected DesktopSyncService $syncService,
    ) {}

    /**
     * List registered desktop apps with their config status.
     */
    public function index(Request $request): JsonResponse
    {
        $configs = DesktopAppConfig::where('user_id', $request->user()->id)
            ->get()
            ->keyBy('app_slug');

        $knownApps = DesktopAppConfig::knownApps();
        $result = [];

        foreach ($knownApps as $slug => $app) {
            $config = $configs->get($slug);

            $result[] = [
                'slug' => $slug,
                'name' => $app['name'],
                'config_path' => $config?->config_path ?? $app['config_path'],
                'supports' => $app['supports'],
                'registered' => $config !== null,
                'sync_mcp' => $config?->sync_mcp ?? false,
                'sync_settings' => $config?->sync_settings ?? false,
                'last_synced_at' => $config?->last_synced_at?->toIso8601String(),
            ];
        }

        return response()->json(['data' => $result]);
    }

    /**
     * Detect which desktop apps are installed on this machine.
     */
    public function detect(): JsonResponse
    {
        return response()->json(['data' => DesktopAppConfig::detectInstalled()]);
    }

    /**
     * Register or update a desktop app config.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'app_slug' => 'required|string|max:50',
            'config_path' => 'nullable|string|max:500',
            'sync_mcp' => 'nullable|boolean',
            'sync_settings' => 'nullable|boolean',
        ]);

        $knownApps = DesktopAppConfig::knownApps();
        $defaultPath = $knownApps[$validated['app_slug']]['config_path'] ?? '';

        $config = DesktopAppConfig::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'app_slug' => $validated['app_slug'],
            ],
            [
                'config_path' => $validated['config_path'] ?? $defaultPath,
                'sync_mcp' => $validated['sync_mcp'] ?? true,
                'sync_settings' => $validated['sync_settings'] ?? false,
            ],
        );

        return response()->json(['data' => $config], 201);
    }

    /**
     * Remove a registered desktop app config.
     */
    public function destroy(Request $request, string $appSlug): JsonResponse
    {
        DesktopAppConfig::where('user_id', $request->user()->id)
            ->where('app_slug', $appSlug)
            ->delete();

        return response()->json(['message' => 'Desktop app config removed.']);
    }

    /**
     * Sync MCP servers and settings to all registered desktop apps.
     */
    public function syncAll(Request $request): JsonResponse
    {
        $projectId = $request->input('project_id');

        $results = $this->syncService->syncAll($request->user(), $projectId);

        return response()->json(['data' => $results]);
    }

    /**
     * Sync MCP servers and settings to a specific desktop app.
     */
    public function syncApp(Request $request, string $appSlug): JsonResponse
    {
        $config = DesktopAppConfig::where('user_id', $request->user()->id)
            ->where('app_slug', $appSlug)
            ->firstOrFail();

        $projectId = $request->input('project_id');
        $result = $this->syncService->syncApp($config, $request->user(), $projectId);

        return response()->json(['data' => $result]);
    }

    /**
     * Preview what would be written to a desktop app config.
     */
    public function preview(Request $request, string $appSlug): JsonResponse
    {
        $config = DesktopAppConfig::where('user_id', $request->user()->id)
            ->where('app_slug', $appSlug)
            ->firstOrFail();

        $projectId = $request->input('project_id');
        $preview = $this->syncService->preview($config, $request->user(), $projectId);

        return response()->json(['data' => $preview]);
    }

    /**
     * Import MCP servers from existing desktop app configs into a project.
     */
    public function importMcp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => 'required|integer|exists:projects,id',
        ]);

        $result = $this->syncService->importMcpServers(
            $request->user(),
            $validated['project_id'],
        );

        return response()->json(['data' => $result]);
    }
}
