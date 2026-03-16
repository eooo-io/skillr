<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // WARNING: This seeds a default admin account with a weak password.
        // Change these credentials immediately in any non-local environment.
        if (app()->isProduction()) {
            $this->command->warn('Skipping default admin user in production. Create users manually.');
        } else {
            User::firstOrCreate(
                ['email' => 'admin@admin.com'],
                ['name' => 'Admin', 'password' => bcrypt('password')],
            );
        }

        $this->call(LibrarySkillSeeder::class);
        $this->call(ComplianceSkillSeeder::class);
        $this->call(AgentSeeder::class);
        $this->call(PlanSeeder::class);
    }
}
