<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class Restitution extends Model
{
    use HasFactory;

    protected $table = 'xrcaution';
    protected $primaryKey = 'xnum_0';
    public $incrementing = false;
    protected $keyType = 'string';
    // timestamps are true by default; required for your sequence logic

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
        'remarques',
    ];

    protected $casts = [
        'xdate_0' => 'date',
        'montant' => 'decimal:2',
        'xvalsta_0' => 'integer',
    ];

    protected $attributes = [
        'xvalsta_0' => 1, // Non validé
    ];

    // ---------------- Relations ----------------
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

    // ---------------- Boot & Activity Logging ----------------
    protected static function boot()
    {
        parent::boot();

        // generate xnum_0 if missing
        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} =
                    $model->{$model->getKeyName()} ?? $model->generateRestitutionNumber();
            }
        });

        // helper: only log fillable fields (minus timestamps)
        $onlyLoggable = static function ($model, array $data) {
            $fillable = array_flip($model->getFillable());
            $data = array_intersect_key($data, $fillable);
            unset($data['created_at'], $data['updated_at']);
            return $data;
        };

        // CREATED
        static::created(function ($model) use ($onlyLoggable) {
            $attrs = $onlyLoggable($model, $model->getAttributes());

            $log = activity()->useLog('restitution')
                ->event('created')
                ->performedOn($model)
                ->withProperties(['attributes' => $attrs]);

            if ($u = (Auth::user() ?: request()->user())) {
                $log->causedBy($u);
            }

            Log::info('[Restitution] created', [
                'xnum_0'     => $model->xnum_0,
                'causer_id'  => optional(Auth::user())->getKey(),
                'causer_set' => (bool) Auth::user(),
            ]);

            $log->log('restitution_created');
        });

        // UPDATED (ignore updated_at-only noise)
        static::updated(function ($model) use ($onlyLoggable) {
            $changes = $model->getChanges();
            if (count($changes) === 1 && array_key_exists('updated_at', $changes)) {
                return;
            }

            $old = $onlyLoggable($model, array_intersect_key($model->getOriginal(), $changes));
            $new = $onlyLoggable($model, $changes);

            $log = activity()->useLog('restitution')
                ->event('updated')
                ->performedOn($model)
                ->withProperties(['old' => $old, 'new' => $new]);

            if ($u = (Auth::user() ?: request()->user())) {
                $log->causedBy($u);
            }

            Log::info('[Restitution] updated', [
                'xnum_0'    => $model->xnum_0,
                'changed'   => array_keys($changes),
                'causer_id' => optional(Auth::user())->getKey(),
            ]);

            $log->log('restitution_updated');
        });

        // DELETED
        static::deleted(function ($model) use ($onlyLoggable) {
            $attrs = $onlyLoggable($model, $model->getOriginal());

            $log = activity()->useLog('restitution')
                ->event('deleted')
                ->performedOn($model)
                ->withProperties(['attributes' => $attrs]);

            if ($u = (Auth::user() ?: request()->user())) {
                $log->causedBy($u);
            }

            Log::info('[Restitution] deleted', [
                'xnum_0'    => $model->xnum_0,
                'causer_id' => optional(Auth::user())->getKey(),
            ]);

            $log->log('restitution_deleted');
        });
    }

    // ---------------- Number generation ----------------
    private function generateRestitutionNumber()
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

        return sprintf(
            'RC%s%s%s%s-%04d',
            $this->xsite_0, // site code
            $year, $month, $day, $seq
        );
    }
}
