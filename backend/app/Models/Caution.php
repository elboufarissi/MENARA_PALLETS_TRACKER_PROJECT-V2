<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Caution extends Model
{
    use HasFactory;
      

    protected $table = 'xcautions'; // Match your database table name
    protected $primaryKey = 'xnum_0'; // Match your primary key column
    public $incrementing = false; // If xnum_0 is not auto-incrementing
    protected $keyType = 'string'; // If xnum_0 is a string

    protected $fillable = [
        'xnum_0',
        'xsite_0',
        'xclient_0',
        'xraison_0',
        'xcin_0',
        'xdate_0',
        'xheure_0',
        'montant',
        'nombre_palette',
        'xvalsta_0',
        'UPDDATTIM',
    ];    protected $casts = [
        'xdate_0' => 'date',
        'montant' => 'decimal:2',
        'nombre_palette' => 'integer',
        'xvalsta_0' => 'integer',
    ];
    
    // Set default values
    protected $attributes = [
        'xvalsta_0' => 1, // Default = 1 (Non validé)
    ];
    
    /**
     * Boot method to automatically calculate nombre_palette
     */
    protected static function boot()
    {
        parent::boot();
        
        // Calculate nombre_palette before creating
        static::creating(function ($caution) {
            if ($caution->montant) {
                $caution->nombre_palette = intval($caution->montant / 100);
            }
        });
        
        // Calculate nombre_palette before updating
        static::updating(function ($caution) {
            if ($caution->isDirty('montant') && $caution->montant) {
                $caution->nombre_palette = intval($caution->montant / 100);
            }
        });
    }
    
    /**
     * Get the time formatted for display
     *
     * @return string
     */
    public function getFormattedTimeAttribute()
    {
        return !empty($this->xheure_0) ? $this->xheure_0 : now()->format('H:i');
    }
}
