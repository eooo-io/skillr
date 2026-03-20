<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            $table->string('category')->nullable()->after('description');
            $table->string('skill_type')->nullable()->after('category');
            $table->longText('gotchas')->nullable()->after('body');
        });
    }

    public function down(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            $table->dropColumn(['category', 'skill_type', 'gotchas']);
        });
    }
};
