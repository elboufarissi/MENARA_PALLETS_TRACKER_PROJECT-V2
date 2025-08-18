<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BpCustomerSeeder extends Seeder
{
    public function run()
    {
        // Insert sample customers
        DB::table('bp_customer')->insert([
            [
                'bpcnum_0' => '78807',
                'bpcnam_0' => 'MOHAMED OUABBAD',
                'tsccod_0' => 'P',
                'ostctl_0' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Add more sample customers if needed
        ]);
    }
} 