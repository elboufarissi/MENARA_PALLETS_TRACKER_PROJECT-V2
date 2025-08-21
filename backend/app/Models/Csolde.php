<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\Xcaution;
use App\Models\Consignation;
use App\Models\Deconsignation;
use App\Models\Restitution;

class Csolde extends Model
{
    use HasFactory;

    protected $table = 'csolde';
    protected $primaryKey = ['codeClient', 'site'];
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'codeClient',
        'site',
        'solde',
        'updated_at',
    ];

    protected $casts = [
        'solde' => 'decimal:2',
    ];

    /**
     * Comprehensive solde recalculation using the full formula
     * SOLDE = (SUM MONTANT in xcautions where XVALSTA=2) - (SUM palette_a_consigner*100 in consignations where XVALSTA=2) + (SUM palette_deconsignees*100 in deconsignations where XVALSTA=2) - (SUM MONTANT in restitutions where XVALSTA=2)
     */
    public static function recalculateBalance($codeClient, $site)
    {
        try {
            Log::info("Starting comprehensive balance recalculation for {$codeClient}/{$site}");

            // Sum montant from validated cautions (positive contribution)
            $cautionTotal = 0;
            try {
                $cautionTotal = Xcaution::where('xclient_0', $codeClient)
                                       ->where('xsite_0', $site)
                                       ->where('xvalsta_0', 2)
                                       ->sum('montant') ?? 0;
            } catch (\Exception $e) {
                Log::warning("Xcaution table not found or error: " . $e->getMessage());
            }

            // Sum palette_a_consigner*100 from validated consignations (negative contribution)
            $consignationTotal = 0;
            try {
                if (Schema::hasTable('xconsignation')) {
                    $consignationTotal = Consignation::where('xclient_0', $codeClient)
                                                     ->where('xsite_0', $site)
                                                     ->where('xvalsta_0', 2)
                                                     ->sum(DB::raw('palette_a_consigner * 100')) ?? 0;
                }
            } catch (\Exception $e) {
                Log::warning("Consignation table not found or error: " . $e->getMessage());
            }

            // Sum palette_deconsignees*100 from validated deconsignations (positive contribution)
            $deconsignationTotal = 0;
            try {
                if (Schema::hasTable('xdeconsignation')) {
                    $deconsignationTotal = Deconsignation::where('xclient_0', $codeClient)
                                                         ->where('xsite_0', $site)
                                                         ->where('xvalsta_0', 2)
                                                         ->sum(DB::raw('palette_deconsignees * 100')) ?? 0;
                }
            } catch (\Exception $e) {
                Log::warning("Deconsignation table not found or error: " . $e->getMessage());
            }

            // Sum montant from validated restitutions (negative contribution)
            $restitutionTotal = 0;
            try {
                Log::info("Checking restitutions table for balance calculation", [
                    'client' => $codeClient,
                    'site' => $site,
                    'table_exists_restitutions' => Schema::hasTable('restitutions'),
                    'table_exists_xrcaution' => Schema::hasTable('xrcaution')
                ]);
                
                if (Schema::hasTable('xrcaution')) {
                    // First, let's see all restitutions for this client/site regardless of validation
                    $allRestitutions = Restitution::where('xclient_0', $codeClient)
                                                 ->where('xsite_0', $site)
                                                 ->get();
                    
                    Log::info("All restitutions found for client/site:", [
                        'client' => $codeClient,
                        'site' => $site,
                        'total_count' => $allRestitutions->count(),
                        'all_restitutions' => $allRestitutions->toArray()
                    ]);
                    
                    // Now get only validated ones
                    $restitutions = Restitution::where('xclient_0', $codeClient)
                                               ->where('xsite_0', $site)
                                               ->where('xvalsta_0', 2)
                                               ->get();
                    
                    $restitutionTotal = $restitutions->sum('montant') ?? 0;
                    
                    Log::info("Validated restitution details for balance calculation:", [
                        'client' => $codeClient,
                        'site' => $site,
                        'validated_count' => $restitutions->count(),
                        'validated_restitutions' => $restitutions->toArray(),
                        'restitution_total' => $restitutionTotal
                    ]);
                }
            } catch (\Exception $e) {
                Log::warning("Restitution table not found or error: " . $e->getMessage());
                Log::error("Exception details: ", ['exception' => $e]);
            }

            // Calculate final solde using the comprehensive formula
            $newSolde = $cautionTotal - $consignationTotal + $deconsignationTotal - $restitutionTotal;

            Log::info("Balance calculation details for {$codeClient}/{$site}:", [
                'caution_total' => $cautionTotal,
                'consignation_total' => $consignationTotal,
                'deconsignation_total' => $deconsignationTotal,
                'restitution_total' => $restitutionTotal,
                'new_solde' => $newSolde
            ]);

            // Update or create the balance record
            $record = self::updateOrCreate(
                ['codeClient' => $codeClient, 'site' => $site],
                [
                    'solde' => $newSolde,
                    'updated_at' => now()
                ]
            );

            Log::info("Balance record updated in database:", [
                'client' => $codeClient,
                'site' => $site,
                'old_solde' => $record->getOriginal('solde') ?? 'new record',
                'new_solde' => $newSolde,
                'record_id' => $record->exists ? 'updated' : 'created'
            ]);

            Log::info("Balance recalculation completed successfully for {$codeClient}/{$site}: new solde = {$newSolde}");

            return $newSolde;

        } catch (\Exception $e) {
            Log::error("Error in recalculateBalance for {$codeClient}/{$site}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get balance for a client/site
     */
    public static function getBalance($codeClient, $site)
    {
        $record = self::where('codeClient', $codeClient)
                     ->where('site', $site)
                     ->first();

        return $record ? $record->solde : 0;
    }

    /**
     * Handle composite primary key for save operations
     */
    protected function setKeysForSaveQuery($query)
    {
        $keys = $this->getKeyName();
        if (!is_array($keys)) {
            return parent::setKeysForSaveQuery($query);
        }
        
        foreach ($keys as $keyName) {
            $query->where($keyName, '=', $this->getKeyForSaveQuery($keyName));
        }
        
        return $query;
    }

    protected function getKeyForSaveQuery($keyName = null)
    {
        if (is_null($keyName)) {
            $keyName = $this->getKeyName();
        }
        
        if (isset($this->original[$keyName])) {
            return $this->original[$keyName];
        }
        
        return $this->getAttribute($keyName);
    }
}
