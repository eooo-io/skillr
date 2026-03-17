<?php

namespace App\Jobs;

use App\Models\Project;
use App\Services\ProjectScanService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProjectScanJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Project $project,
    ) {}

    public function handle(ProjectScanService $scanService): void
    {
        $scanService->scan($this->project);
    }
}
