<?php // backend/app/Models/Xcaution.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str; // For UUID generation if needed
use Illuminate\Support\Facades\Log;

// Import related models
use App\Models\Facility;
use App\Models\BpCustomer;

class Xcaution extends Model
{
    protected $table = 'xcautions';
    protected $primaryKey = 'xnum_0';
    public $incrementing = false;
    protected $keyType = 'string';

    // Use standard Laravel timestamps
    public $timestamps = true;

    // Fields that can be mass-assigned.
    // xnum_0 and auuid are often handled by boot methods or set before create.
    protected $fillable = [
        'xnum_0',
        'xsite_0',
        'xclient_0',
        'xraison_0',
        'xcin_0',
        'xdate_0',
        'xheure_0',
        'xvalsta_0',
        'montant',
        'auuid',
        'creusr',
        'updusr'
    ];

    protected $casts = [
        'xvalsta_0' => 'integer',
        'xdate_0'   => 'date:Y-m-d', // Ensures it's treated as a date object and stored in Y-m-d
        'montant'   => 'decimal:2', // Good for monetary values
    ];

    // Set default values
    protected $attributes = [
        'xvalsta_0' => 1, // Default = 1 (Non validé)
    ];

    // Boot method for generating xnum_0 and auuid if they are not provided by the form
    // and need to be auto-generated.
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                // Let the value from the form be used if provided
                $model->{$model->getKeyName()} = $model->{$model->getKeyName()} ?? $model->generateCautionNumber();
            }
            if (empty($model->auuid)) {
                $model->auuid = (string) Str::uuid();
            }
            // You might also want to set creusr/updusr here if using Auth
            // if (auth()->check()) {
            //     $model->creusr = $model->creusr ?? auth()->id();
            //     $model->updusr = $model->updusr ?? auth()->id();
            // }
        });

        // Update balance when caution is created (only if validated)
        static::created(function ($caution) {
            if ($caution->xvalsta_0 == 2) {
                try {
                    \App\Models\Csolde::recalculateBalance($caution->xclient_0, $caution->xsite_0);
                    Log::info("Balance recalculated after caution creation: Client={$caution->xclient_0}, Site={$caution->xsite_0}");
                } catch (\Exception $e) {
                    Log::error("Error recalculating balance after caution creation: " . $e->getMessage());
                }
            }
        });

        // Update balance when caution is updated (check if validation status changed)
        static::updated(function ($caution) {
            $originalStatus = $caution->getOriginal('xvalsta_0');
            $newStatus = $caution->xvalsta_0;
            
            // Recalculate balance if validation status changed or if it's already validated
            if ($originalStatus != $newStatus || $newStatus == 2) {
                try {
                    \App\Models\Csolde::recalculateBalance($caution->xclient_0, $caution->xsite_0);
                    Log::info("Balance recalculated after caution update: Client={$caution->xclient_0}, Site={$caution->xsite_0}, Status: {$originalStatus} -> {$newStatus}");
                } catch (\Exception $e) {
                    Log::error("Error recalculating balance after caution update: " . $e->getMessage());
                }
            }
        });

        // static::updating(function ($model) {
        //     if (auth()->check()) {
        //         $model->updusr = auth()->id();
        //     }
        // });
    }

    private function generateCautionNumber()
    {
        $date = now();
        $year = $date->format('y');  // 2-digit year
        $month = $date->format('m');
        $day = $date->format('d');
        
        // Get the last caution number for the current month only
        $lastCaution = Xcaution::whereYear('created_at', $date->year)
                              ->whereMonth('created_at', $date->month)
                              ->orderBy('created_at', 'desc')
                              ->first();
        
        // Start sequence at 1 for each new month, or increment from last sequence
        $sequence = 1;
        if ($lastCaution) {
            // Extract the sequence number from the last caution
            $matches = [];
            if (preg_match('/-(\d{4})$/', $lastCaution->xnum_0, $matches)) {
                $sequence = intval($matches[1]) + 1;
            }
        }
        
        // Format: CTSITEANNEEMOISJOUR-XXXX
        return sprintf("CT%s%s%s%s-%04d", 
            $this->xsite_0,  // Site code
            $year,           // 2-digit year
            $month,          // Month
            $day,           // Day
            $sequence       // 4-digit sequence number
        );
    }

    public function facility()
    {
        return $this->belongsTo(Facility::class, 'xsite_0', 'fcy_0');
    }

    public function customer()
    {
        return $this->belongsTo(BpCustomer::class, 'xclient_0', 'BPCNUM_0');
    }
}