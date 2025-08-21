<?php

namespace App\Http\Controllers;

use App\Models\Facility;
use Illuminate\Http\Request;

class SiteController extends Controller
{    public function index()
    {
        try {
            // Query: SELECT FCY_0, FCYNAM_0 FROM FACILITY WHERE CPY_0='208'
                // $facilities = Facility::where('cpy_0', '208')
                //                ->select('FCY_0', 'FCYNAM_0')
                //                ->get();    
            $facilities = FACILITY:: 
                                select('FCY_0', 'FCYNAM_0')
                               ->get();            // Transform to match frontend expectations
            $sites = $facilities->map(function($facility) {
                return [
                    'id' => $facility->FCY_0,
                    'site_code' => $facility->FCY_0,
                    'site_name' => $facility->FCY_0,    // Display site code instead of name
                    'FCY_0' => $facility->FCY_0,        // Keep original for compatibility
                    'FCYNAM_0' => $facility->FCYNAM_0   // Keep original for compatibility
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $sites,
                'count' => $sites->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'message' => 'Failed to fetch sites/facilities'
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $site = FACILITY:: 
                          where('FCY_0', $id)
                          ->first();

            if (!$site) {
                return response()->json([
                    'success' => false,
                    'message' => 'Site not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $site
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'message' => 'Failed to fetch site'
            ], 500);
        }
    }
}