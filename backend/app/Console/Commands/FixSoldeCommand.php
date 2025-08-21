<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Csolde;
use Illuminate\Support\Facades\DB;

class FixSoldeCommand extends Command
{
    protected $signature = 'solde:fix {--client=} {--site=}';
    protected $description = 'Fix solde calculations by running comprehensive recalculation';

    public function handle()
    {
        $client = $this->option('client');
        $site = $this->option('site');

        if ($client && $site) {
            // Fix specific client/site
            $this->info("Fixing balance for client: {$client}, site: {$site}");
            try {
                $newBalance = Csolde::recalculateBalance($client, $site);
                $this->info("New balance: {$newBalance}");
            } catch (\Exception $e) {
                $this->error("Error: " . $e->getMessage());
            }
        } else {
            // Fix all balances
            $this->info("Fixing all balances...");
            
            // Get all unique client/site combinations from csolde table
            $combinations = DB::table('csolde')
                            ->select('codeClient', 'site')
                            ->distinct()
                            ->get();

            foreach ($combinations as $combo) {
                try {
                    $newBalance = Csolde::recalculateBalance($combo->codeClient, $combo->site);
                    $this->info("Fixed {$combo->codeClient}/{$combo->site}: {$newBalance}");
                } catch (\Exception $e) {
                    $this->error("Error fixing {$combo->codeClient}/{$combo->site}: " . $e->getMessage());
                }
            }
        }

        $this->info("Balance fix completed!");
    }
}
