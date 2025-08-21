<?php // backend/app/Models/Xcaution.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class Xcaution extends Model
{
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

    protected static function boot()
    {
        parent::boot();

        // ----- creating: id/uuid + creator -----
        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} =
                    $model->{$model->getKeyName()} ?? $model->generateCautionNumber();
            }
            if (empty($model->auuid)) {
                $model->auuid = (string) Str::uuid();
            }

            if ($u = (Auth::user() ?: request()->user())) {
                $model->creusr = $model->creusr ?? $u->getKey();
                $model->updusr = $model->updusr ?? $u->getKey();
            }
        });

        // helper: only log fillable (minus timestamps)
        $onlyLoggable = static function ($model, array $data) {
            $fillable = array_flip($model->getFillable());
            $data = array_intersect_key($data, $fillable);
            unset($data['created_at'], $data['updated_at']);
            return $data;
        };

        // ----- created: activity + optional balance -----
        static::created(function ($model) use ($onlyLoggable) {
            $attrs = $onlyLoggable($model, $model->getAttributes());

            $log = activity()->useLog('caution')
                ->event('created')
                ->performedOn($model)
                ->withProperties(['attributes' => $attrs]);

            if ($u = (Auth::user() ?: request()->user())) {
                $log->causedBy($u);
            }

            Log::info('[Xcaution] created', [
                'xnum_0'    => $model->xnum_0,
                'causer_id' => optional(Auth::user())->getKey(),
                'causer_set'=> (bool) Auth::user(),
            ]);

            $log->log('xcaution_created');

            // Balance recalc if already validated
            if ((int) $model->xvalsta_0 === 2) {
                try {
                    \App\Models\Csolde::recalculateBalance($model->xclient_0, $model->xsite_0);
                    Log::info('[Xcaution] balance recalculated (created)', [
                        'client' => $model->xclient_0, 'site' => $model->xsite_0,
                    ]);
                } catch (\Throwable $e) {
                    Log::error('[Xcaution] recalc (created) failed: '.$e->getMessage());
                }
            }
        });

        // ----- updating: set updusr -----
        static::updating(function ($model) {
            if ($u = (Auth::user() ?: request()->user())) {
                $model->updusr = $u->getKey();
            }
        });

        // ----- updated: activity + conditional balance -----
        static::updated(function ($model) use ($onlyLoggable) {
            $changes = $model->getChanges();
            if (count($changes) === 1 && array_key_exists('updated_at', $changes)) {
                return; // ignore noise
            }

            $old = $onlyLoggable($model, array_intersect_key($model->getOriginal(), $changes));
            $new = $onlyLoggable($model, $changes);

            $log = activity()->useLog('caution')
                ->event('updated')
                ->performedOn($model)
                ->withProperties(['old' => $old, 'new' => $new]);

            if ($u = (Auth::user() ?: request()->user())) {
                $log->causedBy($u);
            }

            Log::info('[Xcaution] updated', [
                'xnum_0'      => $model->xnum_0,
                'changed'     => array_keys($changes),
                'causer_id'   => optional(Auth::user())->getKey(),
                'status_from' => $model->getOriginal('xvalsta_0'),
                'status_to'   => $model->xvalsta_0,
            ]);

            $log->log('xcaution_updated');

            // Recalc if status changed OR already validated
            $from = (int) $model->getOriginal('xvalsta_0');
            $to   = (int) $model->xvalsta_0;
            if ($from !== $to || $to === 2) {
                try {
                    \App\Models\Csolde::recalculateBalance($model->xclient_0, $model->xsite_0);
                    Log::info('[Xcaution] balance recalculated (updated)', [
                        'client' => $model->xclient_0, 'site' => $model->xsite_0,
                    ]);
                } catch (\Throwable $e) {
                    Log::error('[Xcaution] recalc (updated) failed: '.$e->getMessage());
                }
            }
        });

        // ----- deleted: activity -----
        static::deleted(function ($model) use ($onlyLoggable) {
            $attrs = $onlyLoggable($model, $model->getOriginal());

            $log = activity()->useLog('caution')
                ->event('deleted')
                ->performedOn($model)
                ->withProperties(['attributes' => $attrs]);

            if ($u = (Auth::user() ?: request()->user())) {
                $log->causedBy($u);
            }

            Log::info('[Xcaution] deleted', [
                'xnum_0'    => $model->xnum_0,
                'causer_id' => optional(Auth::user())->getKey(),
            ]);

            $log->log('xcaution_deleted');
        });
    }

    private function generateCautionNumber()
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

        return sprintf('CT%s%s%s%s-%04d',
            $this->xsite_0, $year, $month, $day, $seq
        );
    }

    // Relations
    public function facility()
    {
        return $this->belongsTo(Facility::class, 'xsite_0', 'fcy_0');
    }

    public function customer()
    {
        return $this->belongsTo(BpCustomer::class, 'xclient_0', 'bpcnum_0');
    }
}
