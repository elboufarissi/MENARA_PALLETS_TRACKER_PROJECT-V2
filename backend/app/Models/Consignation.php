<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

use App\Models\Csolde;
use App\Models\User;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Models\Activity;

class Consignation extends Model
{
    use HasFactory, LogsActivity;

    protected $table = 'xconsignation';
    protected $primaryKey = 'xnum_0';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = true;

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
        'updated_at',
    ];

    protected $casts = [
        'xdate_0' => 'date',
        'palette_ramene' => 'integer',
        'palette_a_consigner' => 'integer',
        'palette_consignees' => 'integer',
        'xvalsta_0' => 'integer',
    ];

    protected $attributes = [
        'xvalsta_0' => 1, // 1 = Non validé
    ];

    // ---------- Spatie Activitylog (correct setup) ----------
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('consignation')
            ->logOnly([
                'xnum_0','xsite_0','xclient_0','xraison_0','xbp_0','xcamion_0',
                'xdate_0','xheure_0','palette_ramene','palette_a_consigner',
                'palette_consignees','xvalsta_0',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    // <- add this
    public function tapActivity(Activity $activity, string $event): void
    {
        if (!$activity->causer_id && Auth::check()) {
            $activity->causer()->associate(Auth::user());
        }
    }

    public function getDescriptionForEvent(string $eventName): string
    {
        return "consignation_{$eventName}";
    }

    // ---------- Accessors (back-compat) ----------
    public function getPaletteAConsignerAttribute($value)
    {
        return $value ?? $this->attributes['palette_consigner'] ?? null;
    }

    public function getPaletteConsigneesAttribute($value)
    {
        return $value ?? $this->attributes['palette_consigne'] ?? null;
    }

    public function getPaletteConsignerAttribute()
    {
        return $this->attributes['palette_a_consigner'] ?? null;
    }

    public function getPaletteConsigneAttribute()
    {
        return $this->attributes['palette_consignees'] ?? null;
    }

    // ---------- Relations ----------
    public function facility()
    {
        return $this->belongsTo(Facility::class, 'xsite_0', 'FCY_0');
    }

    public function customer()
    {
        return $this->belongsTo(BpCustomer::class, 'xclient_0', 'BPCNUM_0');
    }

    // ---------- Balance helpers ----------
    public function getSolde()
    {
        return Csolde::getBalance($this->xclient_0, $this->xsite_0);
    }

    public function getSoldeAttribute()
    {
        return $this->getSolde();
    }

    public function getCurrentBalance()
    {
        $balance = DB::table('csolde')
            ->where('codeClient', $this->xclient_0)
            ->where('site', $this->xsite_0)
            ->value('solde');

        return $balance ?? 0;
    }

    public function validateConsignation()
    {
        $currentBalance = $this->getCurrentBalance();
        $requiredAmount = ($this->palette_a_consigner ?? 0) * 100;

        return [
            'is_valid'          => $requiredAmount <= $currentBalance,
            'current_balance'   => $currentBalance,
            'required_amount'   => $requiredAmount,
            'remaining_balance' => $currentBalance - $requiredAmount,
            'client'            => $this->xclient_0,
            'site'              => $this->xsite_0,
        ];
    }

    /** @deprecated Use Csolde::recalculateBalance() instead */
    public function updateBalance()
    {
        return Csolde::recalculateBalance($this->xclient_0, $this->xsite_0);
    }

    // ---------- Number generation ----------
    protected static function boot()
    {
        parent::boot();

        // Auto-generate xnum_0 if missing
        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = $model->generateConsignationNumber($model->xsite_0);
            }
        });
    }

    private function generateConsignationNumber($siteCode = null)
    {
        $date = now();
        $year = $date->format('y');
        $month = $date->format('m');
        $day = $date->format('d');

        $last = self::whereYear('created_at', $date->year)
            ->whereMonth('created_at', $date->month)
            ->orderBy('created_at', 'desc')
            ->first();

        $sequence = 1;
        if ($last && preg_match('/-(\d{4})$/', $last->xnum_0, $m)) {
            $sequence = ((int) $m[1]) + 1;
        }

        $site = $siteCode ?? '';
        return sprintf('CS%s%s%s%s-%04d', $site, $year, $month, $day, $sequence);
    }
}
