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

// Routes for facilities and clients (if still used by your form for dropdowns eventually)
Route::get('/facilities', function () {
    return FACILITY::all(['FCY_0', 'FCYNAM_0']); // Simpler fetch if no specific conditions
});

// Reference tables endpoints for dropdowns
Route::get('/sites', [SiteController::class, 'index'])->name('sites.index');
Route::get('/clients', [ClientController::class, 'index'])->name('clients.index');

// PDF Generation routes
Route::post('/save-pdf-data', [XcautionController::class, 'savePdfData'])->name('xcaution.save-pdf-data');

// Range PDF Generation routes
Route::post('/xcaution/generate-range-pdf', [XcautionController::class, 'generateRangePDF'])->name('xcaution.generate-range-pdf');
Route::get('/xcaution/generate-range-pdf', [XcautionController::class, 'generateRangePDF'])->name('xcaution.generate-range-pdf-get');
Route::post('/consignations/generate-range-pdf', [ConsignationController::class, 'generateRangePDF'])->name('consignations.generate-range-pdf');
Route::get('/consignations/generate-range-pdf', [ConsignationController::class, 'generateRangePDF'])->name('consignations.generate-range-pdf-get');
Route::post('/deconsignations/generate-range-pdf', [DeconsignationController::class, 'generateRangePDF'])->name('deconsignations.generate-range-pdf');
Route::get('/deconsignations/generate-range-pdf', [DeconsignationController::class, 'generateRangePDF'])->name('deconsignations.generate-range-pdf-get');
Route::post('/restitutions/generate-range-pdf', [RestitutionController::class, 'generateRangePDF'])->name('restitutions.generate-range-pdf');
Route::get('/restitutions/generate-range-pdf', [RestitutionController::class, 'generateRangePDF'])->name('restitutions.generate-range-pdf-get');

// Restitution routes

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
    Route::post('/change-password', [AuthController::class, 'changePassword'])->middleware('api.token');
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
});

use App\Http\Controllers\ActivityLogApiController;
Route::middleware(['api.token', 'role_permission:ADMIN'])->group(function () {

    Route::get('/logs', [ActivityLogApiController::class, 'index']);
});

