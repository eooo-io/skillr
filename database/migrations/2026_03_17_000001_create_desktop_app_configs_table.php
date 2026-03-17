<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('desktop_app_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('app_slug'); // claude-desktop, claude-code, cursor, windsurf, codex-cli, chatgpt
            $table->string('config_path'); // resolved path to the config file
            $table->boolean('sync_mcp')->default(true);
            $table->boolean('sync_settings')->default(false);
            $table->json('managed_keys')->nullable(); // which config keys Skillr manages
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'app_slug']);
        });

        Schema::create('workspace_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('default_model')->nullable();
            $table->string('approval_mode')->nullable(); // auto, suggest, manual
            $table->json('allowed_tools')->nullable();
            $table->json('denied_tools')->nullable();
            $table->integer('default_max_tokens')->nullable();
            $table->float('default_temperature')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workspace_profiles');
        Schema::dropIfExists('desktop_app_configs');
    }
};
