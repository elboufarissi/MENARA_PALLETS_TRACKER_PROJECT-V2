<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FacilitySeeder extends Seeder
{
    public function run()
    {
        // Insert sample facilities
        DB::table('facility')->insert([
            [
                'fcy_0' => '201',
                'fcynam_0' => 'Site Principal',
                // 'cpy_0' => '208',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'fcy_0' => '202',
                'fcynam_0' => 'Site Secondaire',
                // 'cpy_0' => '208',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
} 