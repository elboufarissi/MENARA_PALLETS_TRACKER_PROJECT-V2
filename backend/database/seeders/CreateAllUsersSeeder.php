<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class CreateAllUsersSeeder extends Seeder
{


    /**
     * Run the database seeds.
     * This seeder creates all the necessary users for the system.
     *
     * @return void
     */
    public function run()
    {
        $users = [
            [
                'FULL_NAME' => 'Administrator',
                'USERNAME' => 'administrator',
                'ROLE' => 'ADMIN',
                'password' => 'Password@123'
            ],
            [
                'FULL_NAME' => 'user caissiere',
                'USERNAME' => 'ucaissiere',
                'ROLE' => 'CAISSIERE',
                'password' => 'Password@123'
            ],
            [
                'FULL_NAME' => 'user agentordo',
                'USERNAME' => 'uagentordo',
                'ROLE' => 'AGENT_ORDONNANCEMENT',
                'password' => 'Password@123'
            ],
            [
                'FULL_NAME' => 'user chefparc',
                'USERNAME' => 'uchefparc',
                'ROLE' => 'CHEF_PARC',
                'password' => 'Password@123'
            ]
        ];

        foreach ($users as $userData) {
            $existingUser = User::where('USERNAME', $userData['USERNAME'])->first();
            
            if (!$existingUser) {
                $user = User::create([
                    'FULL_NAME' => $userData['FULL_NAME'],
                    'USERNAME' => $userData['USERNAME'],
                    'ROLE' => $userData['ROLE'],
                    'password' => Hash::make($userData['password']),
                    'api_token' => null,
                ]);
                
                $this->command->info('✅ User created successfully!');
                $this->command->info('🆔 User ID: ' . $user->USER_ID);
                $this->command->info('👤 Username: ' . $user->USERNAME);
                $this->command->info('🎭 Role: ' . $user->ROLE);
                $this->command->line('');
            } else {
                $this->command->info('ℹ️  User already exists: ' . $userData['USERNAME']);
                $this->command->info('🆔 User ID: ' . $existingUser->USER_ID);
                $this->command->info('👤 Username: ' . $existingUser->USERNAME);
                $this->command->info('🎭 Role: ' . $existingUser->ROLE);
                $this->command->line('');
            }
        }
        
        $this->command->warn('⚠️  Please change the passwords after first login for security!');
        $this->command->info('🔐 Default password for all users: Password@123');
    }
}


// This seeder creates all the necessary users for the system.
// run it by following these steps to create all users
// 1. Run migration
// php artisan migrate
// 2. Navigate to the backend directory
// cd backend
// 3. Run the seeder
// php artisan db:seed --class=CreateAllUsersSeeder