<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Models\Activity;

class Xcaution extends Model
{
    use HasFactory, LogsActivity;

    protected $table = 'xcautions';
    protected $primaryKey = 'xnum_0';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = true;

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
        'updusr',
    ];

    protected $casts = [
        'xvalsta_0' => 'integer',
        'xdate_0'   => 'date:Y-m-d',
        'montant'   => 'decimal:2',
    ];

    protected $attributes = [
        'xvalsta_0' => 1, // 1 = Non validé
    ];

    // --- Spatie Activitylog (mirror of Deconsignation style) ---
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('caution')
            ->logOnly([
                'xnum_0','xsite_0','xclient_0','xraison_0','xcin_0',
                'xdate_0','xheure_0','xvalsta_0','montant',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function getDescriptionForEvent(string $eventName): string
    {
        return "xcaution_{$eventName}";
    }

    // Ensure causer is the authenticated user (same trick you used elsewhere)
    public function tapActivity(Activity $activity, string $event): void
    {
        if (!$activity->causer_id) {
            if (Auth::check()) {
                $activity->causer()->associate(Auth::user());
            } elseif ($u = request()->user()) {
                $activity->causer()->associate($u);
            }
        }
    }

    // --- Model boot: keep IDs & user columns; remove manual activity()->... ---
    protected static function boot()
    {
        parent::boot();

        // creating: xnum_0 / auuid / creusr,updusr
        static::creating(function (self $model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = $model->generateCautionNumber();
            }
            if (empty($model->auuid)) {
                $model->auuid = (string) Str::uuid();
            }
            if ($u = (Auth::user() ?: request()->user())) {
                $model->creusr = $model->creusr ?? $u->getKey();
                $model->updusr = $model->updusr ?? $u->getKey();
            }
        });

        // updating: updusr
        static::updating(function (self $model) {
            if ($u = (Auth::user() ?: request()->user())) {
                $model->updusr = $u->getKey();
            }
        });

        // NOTE: We intentionally do NOT do any manual activity()->log() calls
        // here; the LogsActivity trait handles created/updated/deleted logs.
        // If you need balance recalcs on state changes, do them in observers
        // or controllers after saving, not by logging again here.
    }

    private function generateCautionNumber(): string
    {
        $date  = now();
        $year  = $date->format('y');
        $month = $date->format('m');
        $day   = $date->format('d');

        $last = self::whereYear('created_at', $date->year)
            ->whereMonth('created_at', $date->month)
            ->orderBy('created_at', 'desc')
            ->first();

        $seq = 1;
        if ($last && preg_match('/-(\d{4})$/', $last->xnum_0, $m)) {
            $seq = (int) $m[1] + 1;
        }

        return sprintf('CT%s%s%s%s-%04d', $this->xsite_0, $year, $month, $day, $seq);
    }

    // Relations
    public function facility()
    {
        return $this->belongsTo(Facility::class, 'xsite_0', 'FCY_0');
        // keep your FK as used elsewhere; change to 'FCY_0' if that's your Facility PK
    }

    public function customer()
    {
        return $this->belongsTo(BpCustomer::class, 'xclient_0', 'BPCNUM_0');
    }
}
