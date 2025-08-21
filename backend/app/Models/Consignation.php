<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\Csolde;
use App\Models\User;

class Consignation extends Model
{
    use HasFactory;

    protected $table = 'xconsignation';
    protected $primaryKey = 'xnum_0';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = true; // use created_at for sequence numbering

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

    protected $attributes = [
        'xvalsta_0' => 1, // 1 = Non validé
    ];

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
        return $this->belongsTo(Facility::class, 'xsite_0', 'fcy_0');
    }

    public function customer()
    {
        return $this->belongsTo(BpCustomer::class, 'xclient_0', 'bpcnum_0');
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
        $balance = \DB::table('csolde')
            ->where('codeClient', $this->xclient_0)
            ->where('site', $this->xsite_0)
            ->value('solde');

        return $balance ?? 0;
    }

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

    /** @deprecated Use Csolde::recalculateBalance() instead */
    public function updateBalance()
    {
        return Csolde::recalculateBalance($this->xclient_0, $this->xsite_0);
    }

    // ---------- NO MIDDLEWARE REQUIRED: resolve causer from Bearer token ----------
    // inside App\Models\Consignation class
// ---------- NO MIDDLEWARE REQUIRED: resolve causer from Bearer token ----------
protected static function resolveCauserFromBearer(): ?User
{
    try {
        Log::info('[Consignation] resolveCauserFromBearer: start');

        // 1) If something else already authenticated the user, use it.
        if ($u = Auth::user()) {
            Log::info('[Consignation] resolveCauserFromBearer: Auth::user() present', [
                'user_id'   => $u->USER_ID ?? null,
                'full_name' => $u->FULL_NAME ?? null,
                'role'      => $u->ROLE ?? null,
            ]);
            return $u;
        }

        $req = request();
        if (!$req) {
            Log::warning('[Consignation] resolveCauserFromBearer: no request()');
            return null;
        }

        // Raw header (for debugging odd formats)
        $authHeader = trim((string) $req->header('Authorization'));
        Log::info('[Consignation] resolveCauserFromBearer: Authorization header seen?', [
            'present'   => $authHeader !== '' ? 'YES' : 'NO',
            'preview'   => $authHeader ? substr($authHeader, 0, 12) . '...' : null,
        ]);

        // 2) Normal bearer extraction
        $token = $req->bearerToken();

        // 3) Defensive parse of "Bearer ..." if bearerToken() failed (spaces, casing, etc.)
        if (!$token && $authHeader !== '' && str_starts_with($authHeader, 'Bearer ')) {
            $token = trim(substr($authHeader, 7));
            Log::info('[Consignation] resolveCauserFromBearer: token recovered from Authorization header');
        }

        // 4) Dev fallbacks (optional): X-API-Token / ?api_token=
        if (!$token) {
            $fallbackHeader = $req->header('X-API-Token');
            $fallbackQuery  = $req->query('api_token');
            if ($fallbackHeader) {
                $token = $fallbackHeader;
                Log::info('[Consignation] resolveCauserFromBearer: token from X-API-Token header');
            } elseif ($fallbackQuery) {
                $token = $fallbackQuery;
                Log::info('[Consignation] resolveCauserFromBearer: token from api_token query');
            }
        }

        Log::info('[Consignation] resolveCauserFromBearer: token status', [
            'present'     => $token ? 'YES' : 'NO',
            'len'         => $token ? strlen($token) : 0,
            'token_preview' => $token ? (substr($token, 0, 4) . '...' . substr($token, -4)) : null,
        ]);

        if (!$token) {
            Log::warning('[Consignation] resolveCauserFromBearer: no token available');
            return null;
        }

        $user = User::where('api_token', $token)->first();

        Log::info('[Consignation] resolveCauserFromBearer: lookup result', [
            'found'     => $user ? 'YES' : 'NO',
            'user_id'   => $user->USER_ID ?? null,
            'full_name' => $user->FULL_NAME ?? null,
            'role'      => $user->ROLE ?? null,
        ]);

        return $user;
    } catch (\Throwable $e) {
        Log::warning('Consignation.resolveCauserFromBearer failed: '.$e->getMessage(), [
            'trace' => $e->getTraceAsString(),
        ]);
        return null;
    }
}



    // ---------- Boot & activity logging ----------
    protected static function boot()
    {
        parent::boot();

        // generate number if missing
        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = $model->{$model->getKeyName()} ?? $model->generateConsignationNumber($model->xsite_0);
            }
        });

        // helper: only log fillable (minus timestamps)
        $onlyLoggable = static function ($model, array $data) {
            $fillable = array_flip($model->getFillable());
            $data = array_intersect_key($data, $fillable);
            unset($data['created_at'], $data['updated_at']);
            return $data;
        };

        // CREATED
        // CREATED
static::created(function ($model) use ($onlyLoggable) {
    $attrs = $onlyLoggable($model, $model->getAttributes());
    $u = self::resolveCauserFromBearer();

    Log::info('[Consignation] created hook', [
        'xnum_0'      => $model->xnum_0,
        'causer_set'  => $u ? 'YES' : 'NO',
        'causer_id'   => $u->USER_ID ?? null,
        'causer_name' => $u->FULL_NAME ?? null,
        'event'       => 'created',
        'props_keys'  => array_keys($attrs),
    ]);

    $log = activity()->useLog('consignation')
        ->event('created')
        ->performedOn($model)
        ->withProperties(['attributes' => $attrs]);

    if ($u) $log->causedBy($u);
    $log->log('consignation_created');
});

// UPDATED (ignore updated_at-only noise)
static::updated(function ($model) use ($onlyLoggable) {
    $changes = $model->getChanges();
    if (count($changes) === 1 && array_key_exists('updated_at', $changes)) return;

    $old = $onlyLoggable($model, array_intersect_key($model->getOriginal(), $changes));
    $new = $onlyLoggable($model, $changes);
    $u = self::resolveCauserFromBearer();

    Log::info('[Consignation] updated hook', [
        'xnum_0'       => $model->xnum_0,
        'causer_set'   => $u ? 'YES' : 'NO',
        'causer_id'    => $u->USER_ID ?? null,
        'causer_name'  => $u->FULL_NAME ?? null,
        'event'        => 'updated',
        'changed_keys' => array_keys($new),
    ]);

    $log = activity()->useLog('consignation')
        ->event('updated')
        ->performedOn($model)
        ->withProperties(['old' => $old, 'new' => $new]);

    if ($u) $log->causedBy($u);
    $log->log('consignation_updated');
});

// DELETED
static::deleted(function ($model) use ($onlyLoggable) {
    $attrs = $onlyLoggable($model, $model->getOriginal());
    $u = self::resolveCauserFromBearer();

    Log::info('[Consignation] deleted hook', [
        'xnum_0'      => $model->xnum_0,
        'causer_set'  => $u ? 'YES' : 'NO',
        'causer_id'   => $u->USER_ID ?? null,
        'causer_name' => $u->FULL_NAME ?? null,
        'event'       => 'deleted',
        'props_keys'  => array_keys($attrs),
    ]);

    $log = activity()->useLog('consignation')
        ->event('deleted')
        ->performedOn($model)
        ->withProperties(['attributes' => $attrs]);

    if ($u) $log->causedBy($u);
    $log->log('consignation_deleted');
});

    }

    // ---------- Number generation ----------
    private function generateConsignationNumber($siteCode = null)
    {
        $date = now();
        $year = $date->format('y');  // 2-digit year
        $month = $date->format('m');
        $day = $date->format('d');

        $lastConsignation = self::whereYear('created_at', $date->year)
            ->whereMonth('created_at', $date->month)
            ->orderBy('created_at', 'desc')
            ->first();

        $sequence = 1;
        if ($lastConsignation) {
            if (preg_match('/-(\d{4})$/', $lastConsignation->xnum_0, $m)) {
                $sequence = intval($m[1]) + 1;
            }
        }

        $site = $siteCode ?? '';
        return sprintf(
            "CS%s%s%s%s-%04d",
            $site,   // site code
            $year,   // YY
            $month,  // MM
            $day,    // DD
            $sequence
        );
    }
}
