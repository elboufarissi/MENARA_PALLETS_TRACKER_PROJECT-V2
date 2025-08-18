<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Restitution extends Model
{
    use HasFactory;

    protected $table = 'xrcaution';
    protected $primaryKey = 'xnum_0';
    public $incrementing = false;
    protected $keyType = 'string';

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
        'caution_ref',
        'remarques'
    ];

    protected $casts = [
        'xdate_0' => 'date',
        'montant' => 'decimal:2',
        'xvalsta_0' => 'integer'
    ];
      // Set default values
    protected $attributes = [
        'xvalsta_0' => 1, // Default = 1 (Non validé)
    ];
    
    // Boot method for generating xnum_0 if not provided by the form
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                // Let the value from the form be used if provided
                $model->{$model->getKeyName()} = $model->{$model->getKeyName()} ?? $model->generateRestitutionNumber();
            }
            // Remove the auuid assignment as this column doesn't exist in the restitutions table
        });
    }

    private function generateRestitutionNumber()
    {
        $date = now();
        $year = $date->format('y');  // 2-digit year
        $month = $date->format('m');
        $day = $date->format('d');
        
        // Get the last restitution number for the current month only
        $lastRestitution = Restitution::whereYear('created_at', $date->year)
                              ->whereMonth('created_at', $date->month)
                              ->orderBy('created_at', 'desc')
                              ->first();
        
        // Start sequence at 1 for each new month, or increment from last sequence
        $sequence = 1;
        if ($lastRestitution) {
            // Extract the sequence number from the last restitution
            $matches = [];
            if (preg_match('/-(\d{4})$/', $lastRestitution->xnum_0, $matches)) {
                $sequence = intval($matches[1]) + 1;
            }
        }
        
        // Format: RCSITEANNEEMOISJOUR-XXXX (Changed from CT to RC prefix)
        return sprintf("RC%s%s%s%s-%04d", 
            $this->xsite_0,  // Site code
            $year,           // 2-digit year
            $month,          // Month
            $day,            // Day
            $sequence        // 4-digit sequence number
        );
    }
    
    // Relationships
    public function facility()
    {
        return $this->belongsTo(Facility::class, 'xsite_0', 'fcy_0');
    }

    public function customer()
    {
        return $this->belongsTo(BpCustomer::class, 'xclient_0', 'bpcnum_0');
    }
    
    public function caution()
    {
        return $this->belongsTo(Xcaution::class, 'caution_ref', 'xnum_0');
    }
}
