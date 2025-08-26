<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Models\Activity;

class Restitution extends Model
{
    use HasFactory, LogsActivity;

    protected $table = 'xrcaution';
    protected $primaryKey = 'xnum_0';
    public $incrementing = false;
    protected $keyType = 'string';
    // $timestamps defaults to true

    protected $fillable = [
        'xnum_0','xsite_0','xclient_0','xraison_0','xcin_0',
        'xdate_0','xheure_0','xvalsta_0','montant','caution_ref','remarques',
    ];

    protected $casts = [
        'xdate_0'  => 'date',
        'montant'  => 'decimal:2',
        'xvalsta_0'=> 'integer',
    ];

    protected $attributes = [
        'xvalsta_0' => 1, // Non validé
    ];

    // --- Spatie Activitylog config (same style as Deconsignation/Consignation)
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('restitution')
            ->logOnly([
                'xnum_0','xsite_0','xclient_0','xraison_0','xcin_0',
                'xdate_0','xheure_0','xvalsta_0','montant','caution_ref','remarques',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    // ensure causer gets attached even if the controller didn’t call causedBy()
    public function tapActivity(Activity $activity, string $event): void
    {
        if (!$activity->causer_id && Auth::check()) {
            $activity->causer()->associate(Auth::user());
        }
    }

    public function getDescriptionForEvent(string $eventName): string
    {
        return "restitution_{$eventName}";
    }

    // --- Relations
    public function facility()
    {
        return $this->belongsTo(Facility::class, 'xsite_0', 'FCY_0');
    }

    public function customer()
    {
        return $this->belongsTo(BpCustomer::class, 'xclient_0', 'BPCNUM_0');
    }

    public function caution()
    {
        return $this->belongsTo(Xcaution::class, 'caution_ref', 'xnum_0');
    }

    // --- Number generation only (no manual activity logging here)
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = $model->generateRestitutionNumber();
            }
        });
    }

    private function generateRestitutionNumber()
    {
        $d = now();
        $last = self::whereYear('created_at', $d->year)
            ->whereMonth('created_at', $d->month)
            ->orderBy('created_at', 'desc')->first();

        $seq = ($last && preg_match('/-(\d{4})$/', $last->xnum_0, $m)) ? ((int)$m[1] + 1) : 1;

        return sprintf('RC%s%s%s%s-%04d',
            $this->xsite_0 ?? '', $d->format('y'), $d->format('m'), $d->format('d'), $seq
        );
    }
}
