<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Deconsignation extends Model
{
    use HasFactory;

    protected $table = 'xdeconsignation';
    protected $primaryKey = 'xnum_0';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = true;    // Changed to true to enable timestamps for sequence numbering
    
    protected $fillable = [
        'xnum_0',
        'xsite_0',
        'xclient_0',
        'xraison_0',
        'xcamion_0',        // External/Internal transporter (matricule)
        'xdate_0',
        'xheure_0',         // Added: Time field
        'palette_ramene',
        'palette_a_deconsigner',  // Renamed from palette_deconsigner
        'palette_deconsignees',   // Renamed from palette_deconsigne
        'xvalsta_0',
    ];    protected $casts = [
        'xdate_0' => 'date',
        'palette_ramene' => 'integer',
        'palette_a_deconsigner' => 'integer',  // Updated field name
        'palette_deconsignees' => 'integer',   // Updated field name
        'xvalsta_0' => 'integer',
    ];

    // Set default values
    protected $attributes = [
        'xvalsta_0' => 1, // Default = 1 (Non validé)
    ];

    // Relationship with Facility (Site)
    public function facility()
    {
        return $this->belongsTo(Facility::class, 'xsite_0', 'fcy_0');
    }

    // Relationship with Customer
    public function customer()
    {
        return $this->belongsTo(BpCustomer::class, 'xclient_0', 'bpcnum_0');
    }
}
