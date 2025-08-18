<?php

namespace App\Http\Middleware;

use Closure;

class RolePermission
{
    public function handle($request, Closure $next, ...$roles)
    {
        $user = $request->user();
        if (!$user || !in_array($user->ROLE, $roles)) {
            return response()->json(['success' => false, 'message' => 'Access denied.'], 403);
        }
        return $next($request);
    }
} 