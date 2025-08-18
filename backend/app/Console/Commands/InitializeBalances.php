<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Caution;
use App\Models\Csolde;

class InitializeBalances extends Command
{
    protected $signature = 'balance:initialize';
    protected $description = 'Initialize balances in csolde table';

    public function handle()
    {
        $this->info('Initializing balances...');
        
        // Clear existing balances
        Csolde::truncate();
        
        // Get unique client/site combinations from validated cautions
        $combinations = Caution::where('xvalsta_0', 2)
                               ->select('xclient_0', 'xsite_0')
                               ->distinct()
                               ->get();
        
        $this->info('Found ' . count($combinations) . ' combinations with validated cautions');
        
        foreach ($combinations as $combination) {
            \App\Models\Csolde::recalculateBalance($combination->xclient_0, $combination->xsite_0);
            $this->line("Updated: {$combination->xclient_0} / {$combination->xsite_0}");
        }
        
        $this->info('Balance initialization complete!');
        return 0;
    }
}
