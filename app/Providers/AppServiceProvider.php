<?php

namespace App\Providers;

use App\Models\Project;
use App\Models\ProjectA2aAgent;
use App\Models\ProjectMcpServer;
use App\Models\Skill;
use App\Models\Webhook;
use App\Policies\ProjectA2aAgentPolicy;
use App\Policies\ProjectMcpServerPolicy;
use App\Policies\ProjectPolicy;
use App\Policies\SkillPolicy;
use App\Policies\WebhookPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Project::class, ProjectPolicy::class);
        Gate::policy(Skill::class, SkillPolicy::class);
        Gate::policy(Webhook::class, WebhookPolicy::class);
        Gate::policy(ProjectMcpServer::class, ProjectMcpServerPolicy::class);
        Gate::policy(ProjectA2aAgent::class, ProjectA2aAgentPolicy::class);
    }
}
