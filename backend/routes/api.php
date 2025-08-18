<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Http\Controllers\XcautionController;
use App\Http\Controllers\ConsignationController;
use App\Http\Controllers\DeconsignationController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\ClientController;
use App\Models\Facility;
use App\Models\BpCustomer;
use App\Http\Controllers\RestitutionController;
use App\Http\Controllers\CamionController;
use App\Http\Controllers\SituationClientController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NotificationController;
use App\Http\Middleware\RolePermission;




Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// For testing, can be removed if not needed
Route::get('/hello', function () {
    return response()->json(['message' => 'Bonjour depuis Laravel']);
});

// Test CORS route
Route::get('/test-cors', function () {
    return response()->json([
        'message' => 'CORS test successful',
        'timestamp' => now(),
        'headers' => request()->headers->all()
    ]);
});

// Test login without authentication
Route::post('/test-login', function (Request $request) {
    return response()->json([
        'message' => 'Login test endpoint reached',
        'received_data' => $request->all(),
        'timestamp' => now()
    ]);
});

// Test PDF route
Route::get('/test-pdf-simple', function () {
    try {
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML('<h1>Test PDF</h1><p>This is a test PDF generation.</p>');
        return $pdf->stream();
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'status' => 'PDF generation failed'
        ], 500);
    }
});

// Test database connection route
Route::get('/test-db', function () {
    try {
        $tables = DB::select('SHOW TABLES');
        $tableNames = array_map(function($table) {
            $tableKey = 'Tables_in_' . config('database.connections.mysql.database');
            return $table->$tableKey;
        }, $tables);

        return response()->json([
            'database' => config('database.connections.mysql.database'),
            'tables' => $tableNames,
            'status' => 'Connected successfully'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'status' => 'Connection failed'
        ], 500);
    }
});

// Routes for facilities and clients (if still used by your form for dropdowns eventually)
Route::get('/facilities', function () {
    return FACILITY::all(['FCY_0', 'FCYNAM_0']); // Simpler fetch if no specific conditions
});

// Reference tables endpoints for dropdowns
Route::get('/sites', [SiteController::class, 'index'])->name('sites.index');
Route::get('/clients', [ClientController::class, 'index'])->name('clients.index');

// PDF Generation routes
Route::post('/save-pdf-data', [XcautionController::class, 'savePdfData'])->name('xcaution.save-pdf-data');
Route::get('/test-pdf', [XcautionController::class, 'testPDF'])->name('xcaution.test-pdf');

// Range PDF Generation routes
Route::post('/xcaution/generate-range-pdf', [XcautionController::class, 'generateRangePDF'])->name('xcaution.generate-range-pdf');
Route::get('/xcaution/generate-range-pdf', [XcautionController::class, 'generateRangePDF'])->name('xcaution.generate-range-pdf-get');
Route::post('/consignations/generate-range-pdf', [ConsignationController::class, 'generateRangePDF'])->name('consignations.generate-range-pdf');
Route::get('/consignations/generate-range-pdf', [ConsignationController::class, 'generateRangePDF'])->name('consignations.generate-range-pdf-get');
Route::post('/deconsignations/generate-range-pdf', [DeconsignationController::class, 'generateRangePDF'])->name('deconsignations.generate-range-pdf');
Route::get('/deconsignations/generate-range-pdf', [DeconsignationController::class, 'generateRangePDF'])->name('deconsignations.generate-range-pdf-get');
Route::post('/restitutions/generate-range-pdf', [RestitutionController::class, 'generateRangePDF'])->name('restitutions.generate-range-pdf');
Route::get('/restitutions/generate-range-pdf', [RestitutionController::class, 'generateRangePDF'])->name('restitutions.generate-range-pdf-get');

// PDF Generation route
Route::post('/generate-pdf', [XcautionController::class, 'testPDF'])->name('xcaution.generate-pdf');

// Simple test route
Route::get('/test-simple', function () {
    return response()->json(['message' => 'API is working', 'time' => now()]);
});

// Test CIN by client endpoint without authentication
Route::get('/test-recuperation-cin/{clientCode}', function ($clientCode) {
    try {
        $controller = new RestitutionController();
        $response = $controller->getCinByClient($clientCode);
        return $response;
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

// Test consignations table
Route::get('/test-consignations', function () {
    try {
        // First check if the table exists
        $tableExists = Schema::hasTable('consignations');
        if (!$tableExists) {
            return response()->json([
                'table' => 'consignations',
                'status' => 'error',
                'error' => 'Table does not exist in database'
            ], 500);
        }

        // Check if required columns exist
        $columns = Schema::getColumnListing('consignations');

        $count = \App\Models\Consignation::count();
        return response()->json([
            'table' => 'consignations',
            'status' => 'exists',
            'record_count' => $count,
            'columns' => $columns,
            'message' => 'Consignations table is working'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'table' => 'consignations',
            'status' => 'error',
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ], 500);
    }
});

// Test deconsignations table
Route::get('/test-deconsignations', function () {
    try {
        // First check if the table exists
        $tableExists = Schema::hasTable('xdeconsignation');
        if (!$tableExists) {
            return response()->json([
                'table' => 'xdeconsignation',
                'status' => 'error',
                'error' => 'Table does not exist in database'
            ], 500);
        }

        // Check if required columns exist
        $columns = Schema::getColumnListing('xdeconsignation');

        $count = \App\Models\Deconsignation::count();
        $sampleData = \App\Models\Deconsignation::orderBy('created_at', 'desc')->take(5)->get();

        return response()->json([
            'table' => 'xdeconsignation',
            'status' => 'exists',
            'record_count' => $count,
            'columns' => $columns,
            'sample_data' => $sampleData,
            'message' => 'Deconsignations table is working'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'table' => 'xdeconsignation',
            'status' => 'error',
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ], 500);
    }
});

// Test xcaution table
Route::get('/test-xcaution', function () {
    try {
        // First check if the table exists
        $tableExists = Schema::hasTable('xcautions');
        if (!$tableExists) {
            return response()->json([
                'table' => 'xcautions',
                'status' => 'error',
                'error' => 'Table does not exist in database'
            ], 500);
        }

        // Check if required columns exist
        $columns = Schema::getColumnListing('xcautions');

        $count = \App\Models\Xcaution::count();
        $sampleData = \App\Models\Xcaution::take(3)->get();

        return response()->json([
            'table' => 'xcautions',
            'status' => 'exists',
            'record_count' => $count,
            'columns' => $columns,
            'sample_data' => $sampleData,
            'message' => 'Xcaution table is working'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'table' => 'xcautions',
            'status' => 'error',
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ], 500);
    }
});



// Debug route to check caution data
Route::get('/debug-caution/{xnum_0}', function ($xnum_0) {
    try {
        $caution = \App\Models\Xcaution::where('xnum_0', $xnum_0)->first();
        if (!$caution) {
            return response()->json(['error' => 'Caution not found']);
        }

        return response()->json([
            'xnum_0' => $caution->xnum_0,
            'xdate_0' => $caution->xdate_0,
            'xdate_0_type' => gettype($caution->xdate_0),
            'xdate_0_raw' => $caution->getRawOriginal('xdate_0'),
            'all_data' => $caution->toArray()
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()]);
    }
});

// Debug route to test PDF generation without authentication
Route::get('/debug-pdf/{xnum_0}', function ($xnum_0) {
    try {
        $controller = new XcautionController();
        return $controller->previewPDF($xnum_0);
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

// Restitution routes
Route::get('restitutions/{xnum_0}/pdf', [RestitutionController::class, 'generatePDF']);
Route::get('restitutions/{xnum_0}/preview-pdf', [RestitutionController::class, 'previewPDF']);
Route::get('restitutions', [RestitutionController::class, 'index']);
Route::post('restitutions', [RestitutionController::class, 'store']);
Route::get('restitutions/{xnum_0}', [RestitutionController::class, 'show']);
Route::put('restitutions/{xnum_0}', [RestitutionController::class, 'update']);
Route::delete('restitutions/{xnum_0}', [RestitutionController::class, 'destroy']);

// Consignation routes
Route::apiResource('consignations', ConsignationController::class);
Route::get('consignations/{xnum_0}/pdf', [ConsignationController::class, 'generatePDF']);
Route::get('consignations/{xnum_0}/preview-pdf', [ConsignationController::class, 'previewPDF']);

// Deconsignation routes
Route::apiResource('deconsignations', DeconsignationController::class);
Route::get('deconsignations/{xnum_0}/pdf', [DeconsignationController::class, 'generatePDF']);
Route::get('deconsignations/{xnum_0}/preview-pdf', [DeconsignationController::class, 'previewPDF']);

// Additional deconsignation PDF routes for frontend compatibility
Route::get('/deconsignation/pdf/{xnum_0}', [DeconsignationController::class, 'previewPDF']);
Route::get('/deconsignation/demande/pdf/{xnum_0}', function($xnum_0) {
    return app(App\Http\Controllers\DeconsignationController::class)->generatePDF($xnum_0, 'demande');
});

// Dropdown data routes for Consignation form
Route::get('delivery-documents', [ConsignationController::class, 'getDeliveryDocuments']);
Route::get('active-trucks', [ConsignationController::class, 'getActiveTrucks']);

// Camion routes
Route::apiResource('camions', CamionController::class);

// Direct database test for xcautions table
Route::get('/test-xcautions-direct', function () {
    try {
        // Direct database query to check xcautions table
        $directQuery = DB::select('SELECT * FROM xcautions LIMIT 5');
        $recordCount = DB::select('SELECT COUNT(*) as count FROM xcautions')[0]->count;

        return response()->json([
            'table' => 'xcautions',
            'status' => 'success',
            'record_count' => $recordCount,
            'sample_records' => $directQuery,
            'message' => 'Direct database query successful'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'table' => 'xcautions',
            'status' => 'error',
            'error' => $e->getMessage(),
            'message' => 'Direct database query failed'
        ], 500);
    }
});

// Test the main xcaution API endpoint
Route::get('/test-xcaution-api', function () {
    try {
        $controller = new XcautionController();
        $response = $controller->index();
        $data = $response->getData();

        return response()->json([
            'api_endpoint' => '/api/xcaution',
            'status' => 'success',
            'record_count' => count($data),
            'sample_data' => array_slice($data, 0, 3),
            'message' => 'XcautionController->index() working correctly'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'api_endpoint' => '/api/xcaution',
            'status' => 'error',
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'message' => 'XcautionController->index() failed'
        ], 500);
    }
});

// Test XNUM_0 monthly reset behavior
Route::get('/test-xnum-monthly-reset', function () {
    try {
        // Get records from different months
        $recordsByMonth = DB::select("
            SELECT
                YEAR(created_at) as year,
                MONTH(created_at) as month,
                xnum_0,
                SUBSTRING(xnum_0, -4) as sequence,
                created_at
            FROM xcautions
            WHERE xsite_0 = 'TST'
            ORDER BY created_at
        ");

        // Group by month
        $monthlyData = [];
        foreach ($recordsByMonth as $record) {
            $key = $record->year . '-' . str_pad($record->month, 2, '0', STR_PAD_LEFT);
            if (!isset($monthlyData[$key])) {
                $monthlyData[$key] = [];
            }
            $monthlyData[$key][] = [
                'xnum_0' => $record->xnum_0,
                'sequence' => $record->sequence,
                'created_at' => $record->created_at
            ];
        }

        return response()->json([
            'status' => 'success',
            'message' => 'XNUM_0 monthly reset analysis',
            'monthly_data' => $monthlyData,
            'explanation' => [
                'format' => 'CTSITEYYMMDDD-XXXX',
                'reset_behavior' => 'Sequence resets to 0001 each new month',
                'filter_logic' => 'whereYear() AND whereMonth() in generateCautionNumber()'
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'error' => $e->getMessage(),
            'message' => 'Failed to analyze monthly reset behavior'
        ], 500);
    }
});

// Endpoint to fetch confirmed PV/AG deliveries
Route::get('sdeliveries', function () {
    try {
        $deliveries = DB::connection('sqlsrv')->select(
            "SELECT SDHNUM_0 FROM SDELIVERY WHERE CFMFLG_0 = 1 AND SOHTYP_0 IN ('PV','AG')"
        );

        return response()->json([
            'success' => true,
            'data' => $deliveries,
            'count' => count($deliveries)
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
        ], 500);
    }
});


// Endpoint to fetch active trucks
Route::get('xcamions', function () {
    try {
        // 🔧 Connexion forcée à SQL Server
        $trucks = DB::connection('sqlsrv')->select(
            "SELECT XMAT_0 FROM XCAMION WHERE ENAFLG_0=2"
        );

        if (empty($trucks)) {
            return response()->json([
                'success' => false,
                'error' => 'No matching records found in XCAMION table.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $trucks,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
        ], 500);
    }
});

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('api.token');
    Route::get('/me', [AuthController::class, 'me'])->middleware('api.token');

    // Debug route to check current authenticated user
    Route::get('/debug-token', function (Illuminate\Http\Request $request) {
        $token = $request->bearerToken();
        $user = $request->user();

        return response()->json([
            'token_present' => $token ? 'YES' : 'NO',
            'token_length' => $token ? strlen($token) : 0,
            'user_authenticated' => $user ? 'YES' : 'NO',
            'user_role' => $user ? $user->ROLE : 'N/A',
            'user_name' => $user ? $user->FULL_NAME : 'N/A',
            'headers' => $request->headers->all()
        ]);
    })->middleware('api.token');
});

// ADMIN: full access
Route::middleware(['api.token', 'role_permission:ADMIN'])->group(function () {
    Route::apiResource('users', UserController::class);
});

// CAISSIER, CAISSIERE: /depot-de-caution , /etat/caution, /recuperation , /flux-interne/deconsignation , /flux-interne/situation-client
Route::middleware(['api.token', 'role_permission:ADMIN,CAISSIER,CAISSIERE'])->group(function () {
    Route::get('/xcaution', [XcautionController::class, 'index']); // depot-de-caution
    Route::post('/xcaution', [XcautionController::class, 'store']);
    Route::get('/xcaution/cin-by-client/{clientCode}', [XcautionController::class, 'getCinByClient']); // get CIN by client - MUST be before parameterized routes
    Route::get('/xcaution/{xnum_0}', [XcautionController::class, 'show']); // get single caution
    Route::put('/xcaution/{xnum_0}', [XcautionController::class, 'update']); // validate caution
    Route::delete('/xcaution/{xnum_0}', [XcautionController::class, 'destroy']); // delete caution
    Route::get('/xcaution/{xnum_0}/preview-pdf', [XcautionController::class, 'previewPDF']); // preview PDF
    Route::get('/xcaution/{xnum_0}/pdf', [XcautionController::class, 'generatePDF']); // download PDF
    Route::get('/etat/caution', function() {
        return response()->json(['message' => 'Etat Caution endpoint - Controller not implemented yet']);
    });
    Route::get('/recuperation', [RestitutionController::class, 'index']);
    Route::get('/recuperation/cin-by-client/{clientCode}', [RestitutionController::class, 'getCinByClient']); // get CIN by client for recuperation
    Route::get('/flux-interne/deconsignation', [DeconsignationController::class, 'index']);
    Route::get('/flux-interne/situation-client', [SituationClientController::class, 'getSituation']);

    // Debug route for CAISSIER/CAISSIERE
    Route::get('/test-caissier-deconsignations', function () {
        try {
            $deconsignations = \App\Models\Deconsignation::orderBy('created_at', 'desc')->get();
            return response()->json([
                'role' => 'CAISSIER/CAISSIERE',
                'status' => 'success',
                'count' => $deconsignations->count(),
                'data' => $deconsignations,
                'message' => 'CAISSIER/CAISSIERE can access déconsignations'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'role' => 'CAISSIER/CAISSIERE',
                'status' => 'error',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    });

    // Test the actual controller method with CAISSIER middleware
    Route::get('/test-caissier-controller-deconsignations', function (Illuminate\Http\Request $request) {
        try {
            $controller = new DeconsignationController();
            $response = $controller->index();
            $data = $response->getData();

            return response()->json([
                'role' => 'CAISSIER/CAISSIERE',
                'middleware_test' => 'success',
                'controller_response' => $data,
                'user_role' => $request->user() ? $request->user()->ROLE : 'N/A',
                'message' => 'CAISSIER/CAISSIERE can access DeconsignationController->index()'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'role' => 'CAISSIER/CAISSIERE',
                'middleware_test' => 'error',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    });
});

// CONSOLIDATED DECONSIGNATIONS ROUTES - Multiple roles can access with different permissions
Route::middleware(['api.token', 'role_permission:ADMIN,CAISSIER,CAISSIERE,AGENT_ORDONNANCEMENT,CHEF_PARC'])->group(function () {
    // All roles can view déconsignations
    Route::get('/deconsignations', [DeconsignationController::class, 'index']);
    Route::get('/deconsignations/{xnum_0}', [DeconsignationController::class, 'show']);

    // All roles can update déconsignations (controller handles role-specific logic)
    Route::put('/deconsignations/{xnum_0}', [DeconsignationController::class, 'update']);

    // Only AGENT_ORDONNANCEMENT can create and delete
    Route::post('/deconsignations', [DeconsignationController::class, 'store'])->middleware('role_permission:ADMIN,AGENT_ORDONNANCEMENT');
    Route::delete('/deconsignations/{xnum_0}', [DeconsignationController::class, 'destroy'])->middleware('role_permission:ADMIN,AGENT_ORDONNANCEMENT');

    // All roles can access solde calculation
    Route::post('consignations/solde', [ConsignationController::class, 'getSolde']);
});

// AGENT_ORDONNANCEMENT: /flux-interne/consignation, /flux-interne/deconsignation
Route::middleware(['api.token', 'role_permission:ADMIN,AGENT_ORDONNANCEMENT'])->group(function () {
    Route::get('/flux-interne/consignation', [ConsignationController::class, 'index']);
    Route::get('/flux-interne/deconsignation', [DeconsignationController::class, 'index']);
});

// CHEF_PARC: /flux-interne/deconsignation
Route::middleware(['api.token', 'role_permission:ADMIN,CHEF_PARC'])->group(function () {
    Route::get('/flux-interne/deconsignation', [DeconsignationController::class, 'index']);
});

// Notification routes - require authentication
Route::middleware(['api.token'])->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/counts', [NotificationController::class, 'getCounts']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::put('/notifications/mark-multiple-read', [NotificationController::class, 'markMultipleAsRead']);
    Route::get('/notifications/{id}', [NotificationController::class, 'show']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    Route::get('/notifications/type/{type}', [NotificationController::class, 'getByType']);
    
    // Test notification endpoint (only in local environment)
    Route::post('/notifications/test', [NotificationController::class, 'testNotification']);
});



