<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

// Import Csolde model for solde calculations
use App\Models\Csolde;

class Consignation extends Model
{
    use HasFactory;
    
    protected $table = 'xconsignation';
    protected $primaryKey = 'xnum_0';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = true; // Changed to true to use created_at for sequence numbering
    
    protected $fillable = [
        'xnum_0',
        'xsite_0',
        'xclient_0',
        'xraison_0',
        'xbp_0',
        'xcamion_0',
        'xdate_0',
        'xheure_0',
        'palette_ramene',
        'palette_a_consigner',
        'palette_consignees',
        'xvalsta_0',
        'created_at',
        'updated_at'
    ];
    
    protected $casts = [
        'xdate_0' => 'date',
        'palette_ramene' => 'integer',
        'palette_a_consigner' => 'integer',
        'palette_consignees' => 'integer',
        'xvalsta_0' => 'integer',
    ];

    // Set default values
    protected $attributes = [
        'xvalsta_0' => 1, // Default = 1 (Non validé)
    ];

    // Accessors for backward compatibility with old column names
    public function getPaletteAConsignerAttribute($value)
    {
        // If the new column exists, return it; otherwise try the old column
        return $value ?? $this->attributes['palette_consigner'] ?? null;
    }

    public function getPaletteConsigneesAttribute($value)
    {
        // If the new column exists, return it; otherwise try the old column
        return $value ?? $this->attributes['palette_consigne'] ?? null;
    }

    // Also provide accessors for old column names to map to new ones
    public function getPaletteConsignerAttribute()
    {
        return $this->attributes['palette_a_consigner'] ?? null;
    }

    public function getPaletteConsigneAttribute()
    {
        return $this->attributes['palette_consignees'] ?? null;
    }

    // Relationship with Facility (Site)
    public function facility()
    {
        return $this->belongsTo(Facility::class, 'xsite_0', 'FCY_0');
    }

    // Relationship with Customer
    public function customer()
    {
        return $this->belongsTo(BpCustomer::class, 'xclient_0', 'BPCNUM_0');
    }
    
    /**
     * Get the current solde for this consignation's client and site
     */
    public function getSolde()
    {
        return Csolde::getBalance($this->xclient_0, $this->xsite_0);
    }
    
    /**
     * Get the solde value as a formatted decimal
     */
    public function getSoldeAttribute()
    {
        return $this->getSolde();
    }
    
    /**
     * Get the current balance for this consignation's client and site
     * This method can be called directly from the frontend via the API
     */
    public function getCurrentBalance()
    {
        // Direct database query to ensure we get the latest balance
        $balance = \DB::table('csolde')
                     ->where('codeClient', $this->xclient_0)
                     ->where('site', $this->xsite_0)
                     ->value('solde');
        
        return $balance ?? 0;
    }
    
    /**
     * Check if consignation is valid based on balance
     * Returns array with validation result and balance info
     */
    public function validateConsignation()
    {
        $currentBalance = $this->getCurrentBalance();
        $requiredAmount = $this->palette_a_consigner * 100;
        
        $isValid = $requiredAmount <= $currentBalance;
        $remainingBalance = $currentBalance - $requiredAmount;
        
        return [
            'is_valid' => $isValid,
            'current_balance' => $currentBalance,
            'required_amount' => $requiredAmount,
            'remaining_balance' => $remainingBalance,
            'client' => $this->xclient_0,
            'site' => $this->xsite_0
        ];
    }
    
    /**
     * Update the balance in csolde table after successful consignation
     * @deprecated Use Csolde::recalculateBalance() instead
     */
    public function updateBalance()
    {
        // DEPRECATED: Use comprehensive recalculation instead
        return \App\Models\Csolde::recalculateBalance($this->xclient_0, $this->xsite_0);
    }
    
    // Boot method for generating xnum_0 if not provided by the form
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                // Let the value from the form be used if provided
                $model->{$model->getKeyName()} = $model->{$model->getKeyName()} ?? $model->generateConsignationNumber($model->xsite_0);
            }
        });

        // Note: Balance validation is handled in the ConsignationController
        // Consignations do NOT update csolde table
        // Only cautions (xcautions) should update the balance
    }    private function generateConsignationNumber($siteCode = null)
    {
        $date = now();
        $year = $date->format('y');  // 2-digit year
        $month = $date->format('m');
        $day = $date->format('d');
          // Get the last consignation number for the current month only
        $lastConsignation = Consignation::whereYear('created_at', $date->year)
                              ->whereMonth('created_at', $date->month)
                              ->orderBy('created_at', 'desc')
                              ->first();
        
        // Start sequence at 1 for each new month, or increment from last sequence
        $sequence = 1;
        if ($lastConsignation) {
            // Extract the sequence number from the last consignation
            $matches = [];
            if (preg_match('/-(\d{4})$/', $lastConsignation->xnum_0, $matches)) {
                $sequence = intval($matches[1]) + 1;
            }
        }
        
        // Format: CSSITEANNEEMOISJOUR-XXXX (Using CS prefix for Consignation)
        // Use provided site code or fallback to empty string
        $site = $siteCode ?? '';
        return sprintf("CS%s%s%s%s-%04d", 
            $site,           // Site code
            $year,           // 2-digit year
            $month,          // Month
            $day,            // Day
            $sequence        // 4-digit sequence number
        );
    }
}
