<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Spatie\Activitylog\Models\Activity;
use App\Models\User;

class ActivityLogApiController extends Controller
{

public function index(Request $request)
{
    $query = Activity::query()->with([
        'causer' => function ($q) {
            // IMPORTANT: include the PK so relation can match
            $q->select('USER_ID', 'FULL_NAME', 'USERNAME', 'ROLE');
        },
    ]);

    // --- filters ---
    if ($request->filled('user')) {
        $needle = $request->input('user');

        // If whereHasMorph exists in your version, use it; otherwise use whereHas
        $query->whereHas('causer', function ($q) use ($needle) {
            $q->where('FULL_NAME', 'like', "%{$needle}%")
              ->orWhere('USERNAME', 'like', "%{$needle}%");
        });
    }

    if ($request->filled('action')) {
        $a = $request->input('action');
        $query->where(function ($qq) use ($a) {
            $qq->where('event', 'like', "%{$a}%")
               ->orWhere('description', 'like', "%{$a}%");
        });
    }
    if ($request->filled('event'))    $query->where('event', $request->input('event'));
    if ($request->filled('log'))      $query->where('log_name', $request->input('log'));
    if ($request->filled('model'))    $query->where('subject_type', 'like', "%".$request->input('model')."%");
    if ($request->filled('subject'))  $query->where('subject_id', 'like', "%".$request->input('subject')."%");

    if ($request->filled('from')) $query->whereDate('created_at', '>=', \Carbon\Carbon::parse($request->input('from'))->startOfDay());
    if ($request->filled('to'))   $query->where('created_at', '<=', \Carbon\Carbon::parse($request->input('to'))->endOfDay());
    if ($request->filled('date') && !$request->filled('from') && !$request->filled('to')) {
        $d = \Carbon\Carbon::parse($request->input('date'));
        $query->whereBetween('created_at', [$d->startOfDay(), $d->endOfDay()]);
    }

    $perPage = min((int) $request->input('per_page', 25), 100);
    $logs = $query->orderByDesc('created_at')->paginate($perPage);

    // flatten useful fields for your React table
    $logs->getCollection()->transform(function ($log) {
        $log->user_full_name = optional($log->causer)->FULL_NAME ?? 'System';
        $log->user_username  = optional($log->causer)->USERNAME;
        $log->user_role      = optional($log->causer)->ROLE;

        $props = $log->properties;
        $log->properties = $props instanceof \Illuminate\Support\Collection
            ? $props->toArray()
            : (is_object($props) ? (array) $props : ($props ?? []));

        $log->subject_model = $log->subject_type ? class_basename($log->subject_type) : null;
        return $log;
    });

    return response()->json($logs);
}

}
