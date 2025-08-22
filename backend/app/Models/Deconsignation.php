<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class Deconsignation extends Model
{
    use HasFactory;

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
        'xvalsta_0' => 1, // Non validé
    ];

    public function facility()
    {
        return $this->belongsTo(Facility::class, 'xsite_0', 'FCY_0');
    }

    public function customer()
    {
        return $this->belongsTo(BpCustomer::class, 'xclient_0', 'BPCNUM_0');
    }

    /**
     * Activity logging (uses middleware-authenticated user via Auth::user()).
     */
    protected static function boot()
    {
        parent::boot();

        // helper: only log fillable fields (minus timestamps if present)
        $onlyLoggable = static function ($model, array $data) {
            $fillable = array_flip($model->getFillable());
            $data = array_intersect_key($data, $fillable);
            unset($data['created_at'], $data['updated_at']);
            return $data;
        };

        // CREATED
        static::created(function ($model) use ($onlyLoggable) {
            $attrs = $onlyLoggable($model, $model->getAttributes());

            $log = activity()->useLog('deconsignation')
                ->event('created')
                ->performedOn($model)
                ->withProperties(['attributes' => $attrs]);

            if ($u = (Auth::user() ?: request()->user())) {
                $log->causedBy($u);
            }

            // (Optional) debug
            Log::info('[Deconsignation] created', [
                'xnum_0'     => $model->xnum_0,
                'causer_set' => (bool) Auth::user(),
                'causer_id'  => Auth::id(),
            ]);

            $log->log('deconsignation_created');
        });

        // UPDATED (ignore updated_at-only noise)
        static::updated(function ($model) use ($onlyLoggable) {
            $changes = $model->getChanges();
            if (count($changes) === 1 && array_key_exists('updated_at', $changes)) {
                return;
            }

            $old = $onlyLoggable($model, array_intersect_key($model->getOriginal(), $changes));
            $new = $onlyLoggable($model, $changes);

            $log = activity()->useLog('deconsignation')
                ->event('updated')
                ->performedOn($model)
                ->withProperties(['old' => $old, 'new' => $new]);

            if ($u = (Auth::user() ?: request()->user())) {
                $log->causedBy($u);
            }

            // (Optional) debug
            Log::info('[Deconsignation] updated', [
                'xnum_0'      => $model->xnum_0,
                'changed'     => array_keys($changes),
                'causer_id'   => Auth::id(),
            ]);

            $log->log('deconsignation_updated');
        });

        // DELETED
        static::deleted(function ($model) use ($onlyLoggable) {
            $attrs = $onlyLoggable($model, $model->getOriginal());

            $log = activity()->useLog('deconsignation')
                ->event('deleted')
                ->performedOn($model)
                ->withProperties(['attributes' => $attrs]);

            if ($u = (Auth::user() ?: request()->user())) {
                $log->causedBy($u);
            }

            // (Optional) debug
            Log::info('[Deconsignation] deleted', [
                'xnum_0'    => $model->xnum_0,
                'causer_id' => Auth::id(),
            ]);

            $log->log('deconsignation_deleted');
        });
    }
}
