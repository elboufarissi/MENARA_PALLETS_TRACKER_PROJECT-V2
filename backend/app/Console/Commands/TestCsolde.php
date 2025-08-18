<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Csolde;
use App\Models\Xcaution;

class TestCsolde extends Command
{
    protected $signature = 'test:csolde {client?} {site?}';
    protected $description = 'Test Csolde balance calculation';

    public function handle()
    {
        $this->info('Testing Csolde model...');
        
        // Show all current records
        $records = Csolde::all();
        $this->info("Current csolde records: " . $records->count());
        
        foreach ($records as $record) {
            $this->info("Client: {$record->codeClient}, Site: {$record->site}, Solde: {$record->solde}");
        }
        
        // Show some validated cautions
        $this->info("\nValidated Xcautions (xvalsta_0 = 2):");
        $cautions = Xcaution::where('xvalsta_0', 2)->take(5)->get();
        
        foreach ($cautions as $caution) {
            $this->info("Caution {$caution->xnum_0}: Client={$caution->xclient_0}, Site={$caution->xsite_0}, Montant={$caution->montant}");
        }
        
        // Test balance recalculation for a specific client/site if provided
        $client = $this->argument('client');
        $site = $this->argument('site');
        
        if ($client && $site) {
            $this->info("\nTesting balance recalculation for Client: {$client}, Site: {$site}");
            try {
                $newBalance = Csolde::recalculateBalance($client, $site);
                $this->info("New balance calculated: {$newBalance}");
            } catch (\Exception $e) {
                $this->error("Error calculating balance: " . $e->getMessage());
            }
        } else {
            // Test with the first available caution
            $firstCaution = Xcaution::where('xvalsta_0', 2)->first();
            if ($firstCaution) {
                $this->info("\nTesting balance recalculation for first validated caution:");
                $this->info("Client: {$firstCaution->xclient_0}, Site: {$firstCaution->xsite_0}");
                try {
                    $newBalance = Csolde::recalculateBalance($firstCaution->xclient_0, $firstCaution->xsite_0);
                    $this->info("New balance calculated: {$newBalance}");
                } catch (\Exception $e) {
                    $this->error("Error calculating balance: " . $e->getMessage());
                }
            }
        }
        
        return 0;
    }
}
