<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Deconsignation extends Model
{
    use HasFactory, LogsActivity;

    protected $table = 'xdeconsignation';
    protected $primaryKey = 'xnum_0';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = true;

    protected $fillable = [
        'xnum_0',
        'xsite_0',
        'xclient_0',
        'xraison_0',
        'xcamion_0',
        'xdate_0',
        'xheure_0',
        'palette_ramene',
        'palette_a_deconsigner',
        'palette_deconsignees',
        'xvalsta_0',
    ];

    protected $casts = [
        'xdate_0' => 'date',
        'palette_ramene' => 'integer',
        'palette_a_deconsigner' => 'integer',
        'palette_deconsignees' => 'integer',
        'xvalsta_0' => 'integer',
    ];

    protected $attributes = [
        'xvalsta_0' => 1, // default: Non validé
    ];

    // 🔑 REQUIRED in Spatie v4+
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('deconsignation')
            ->logOnly([
                'xnum_0',
                'xsite_0',
                'xclient_0',
                'xraison_0',
                'xcamion_0',
                'xdate_0',
                'xheure_0',
                'palette_ramene',
                'palette_a_deconsigner',
                'palette_deconsignees',
                'xvalsta_0',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected static $logName = 'deconsignation';
    protected static $logAttributes = [
        'xnum_0','xsite_0','xclient_0','xraison_0','xcamion_0',
        'xdate_0','xheure_0',
        'palette_ramene','palette_a_deconsigner','palette_deconsignees','xvalsta_0',
    ];
    protected static $logOnlyDirty = true;
    protected static $submitEmptyLogs = false;

    public function getDescriptionForEvent(string $eventName): string
    {
        return "deconsignation_{$eventName}";
    }

    // Relationships
    public function facility()
    {
        return $this->belongsTo(Facility::class, 'xsite_0', 'FCY_0');
    }

    public function customer()
    {
        return $this->belongsTo(BpCustomer::class, 'xclient_0', 'BPCNUM_0');
    }
}
