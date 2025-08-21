<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class ApiTokenAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $token = $request->bearerToken();
            
            // Debug logging
            Log::info('API Token Auth - Token received: ' . ($token ? 'YES' : 'NO'));
            Log::info('API Token Auth - Token value: ' . ($token ?? 'null'));
            Log::info('API Token Auth - Token length: ' . ($token ? strlen($token) : 0));
            
            if (!$token) {
                Log::error('API Token Auth - No token provided');
                return response()->json([
                    'success' => false,
                    'message' => 'Authorization token required'
                ], 401);
            }
            
            Log::info('API Token Auth - About to query database for token');
            $user = User::where('api_token', $token)->first();
            Log::info('API Token Auth - User found: ' . ($user ? 'YES (' . $user->FULL_NAME . ')' : 'NO'));
            
            if (!$user) {
                Log::error('API Token Auth - Invalid token: ' . substr($token, 0, 20) . '...');
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid authorization token'
                ], 401);
            }
            
            Log::info('API Token Auth - Authentication successful for: ' . $user->FULL_NAME);
            
            // Set the authenticated user
            $request->setUserResolver(function () use ($user) {
                return $user;
            });
            
            return $next($request);
            
        } catch (\Exception $e) {
            Log::error('API Token Auth - Exception: ' . $e->getMessage());
            Log::error('API Token Auth - Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Authentication error: ' . $e->getMessage()
            ], 500);
        }
    }
}
