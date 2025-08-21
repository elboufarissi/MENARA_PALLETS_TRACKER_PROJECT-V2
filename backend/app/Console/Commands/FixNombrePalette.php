<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Caution;
use Illuminate\Support\Facades\DB;

class FixNombrePalette extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'fix:nombre-palette';

    /**
     * The console command description.
     */
    protected $description = 'Fix all cautions with NULL nombre_palette by calculating from montant';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fixing Nombre Palette in XCautions Table');
        $this->info('========================================');

        // Check current state
        $total = Caution::count();
        $nullCount = Caution::whereNull('nombre_palette')->count();

        $this->info("Total cautions: {$total}");
        $this->info("Cautions with NULL nombre_palette: {$nullCount}");

        if ($nullCount > 0) {
            $this->info('Updating cautions with calculated nombre_palette...');

            // Update all cautions where nombre_palette is NULL
            $updated = DB::table('xcautions')
                ->whereNull('nombre_palette')
                ->whereNotNull('montant')
                ->update([
                    'nombre_palette' => DB::raw('FLOOR(montant / 100)')
                ]);

            $this->info("Updated {$updated} cautions with calculated nombre_palette");
        } else {
            $this->info('No cautions need updating.');
        }

        // Show some sample data after the fix
        $this->info('');
        $this->info('Sample cautions after fix:');
        $this->info('--------------------------');

        $samples = Caution::take(10)->get(['xnum_0', 'xclient_0', 'xsite_0', 'montant', 'nombre_palette', 'xvalsta_0']);

        foreach ($samples as $caution) {
            $expectedPalette = floor($caution->montant / 100);
            $status = ($caution->nombre_palette == $expectedPalette) ? "✓" : "✗";
            $this->line("{$status} {$caution->xnum_0}: {$caution->xclient_0}/{$caution->xsite_0} - " .
                       "Montant: {$caution->montant} DH, Nombre Palette: {$caution->nombre_palette}, " .
                       "Validation: {$caution->xvalsta_0}");
        }

        $this->info('');
        $this->info('Now test the solde calculation:');
        $this->info('1. Start backend: php artisan serve');
        $this->info('2. Open complete_solde_debug.html');
        $this->info('3. Test with existing client/site combinations');

        return 0;
    }
}
