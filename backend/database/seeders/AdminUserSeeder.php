<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Check if admin user already exists
        $existingAdmin = User::where('USERNAME', 'administrator')->first();
        
        if (!$existingAdmin) {
            User::create([
                'FULL_NAME' => 'Administrator',
                'USERNAME' => 'administrator',
                'ROLE' => 'ADMIN',
                'password' => Hash::make('Password@123'),
                'api_token' => null, // Will be generated when needed, but not now
            ]);
            
            $this->command->info('Admin user created successfully!');
            $this->command->info('Username: administrator');
            $this->command->info('Password: Password@123');
        } else {
            $this->command->info('Admin user already exists. Skipping creation.');
        }
    }
}

// run it by following these steps to create the admin user
// 1. Run migration
// php artisan migrate
// 2. Navigate to the backend directory
// cd backend
// 3. Run the seeder
// php artisan db:seed --class=CreateAdminUserSeeder