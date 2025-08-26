<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class CreateAdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * This seeder can be run independently to create only the admin user.
     *
     * @return void
     */
    public function run()
    {
        // Check if admin user already exists
        $existingAdmin = User::where('USERNAME', 'administrator')->first();
        
        if (!$existingAdmin) {
            $adminUser = User::create([
                'FULL_NAME' => 'Administrator',
                'USERNAME' => 'administrator', 
                'ROLE' => 'ADMIN',
                'password' => Hash::make('Password@123'),
                'api_token' => null,
            ]);
            
            $this->command->info('✅ Admin user created successfully!');
            $this->command->info('🆔 User ID: ' . $adminUser->USER_ID);
            $this->command->info('👤 Username: administrator');
            $this->command->info('🔐 Password: Password@123');
            $this->command->info('🎭 Role: ADMIN');
            $this->command->line('');
            $this->command->warn('⚠️  Please change the password after first login for security!');
        } else {
            $this->command->info('ℹ️  Admin user already exists.');
            $this->command->info('🆔 User ID: ' . $existingAdmin->USER_ID);
            $this->command->info('👤 Username: ' . $existingAdmin->USERNAME);
            $this->command->info('🎭 Role: ' . $existingAdmin->ROLE);
        }
    }
}
