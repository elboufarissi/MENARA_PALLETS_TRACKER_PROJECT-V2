<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\XcautionController;
use App\Http\Controllers\ConsignationController;
use App\Http\Controllers\DeconsignationController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\RestitutionController;
use App\Http\Controllers\CamionController;
use App\Http\Controllers\SituationClientController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Reference tables endpoints for dropdowns
Route::get('/sites', [SiteController::class, 'index'])->name('sites.index');
Route::get('/clients', [ClientController::class, 'index'])->name('clients.index');

// Endpoint to fetch confirmed PV/AG deliveries
Route::get('sdeliveries', function () {
    try {
        $deliveries = DB::select(
            "SELECT SDHNUM_0 FROM sdelevry WHERE CFMFLG_0=1 AND SOHTYP_0 in ('PV','AG')"
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
        $trucks = DB::select(
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
});

// ADMIN: full access
Route::middleware(['api.token', 'role_permission:ADMIN'])->group(function () {
    Route::apiResource('users', UserController::class);

    // Deconsignation PDF routes - ADMIN can print demande deconsignation even when xvalsta_0=1
    Route::get('deconsignations/{xnum_0}/pdf', [DeconsignationController::class, 'generatePDF']);
    Route::get('deconsignations/{xnum_0}/preview-pdf', [DeconsignationController::class, 'previewPDF']);
    Route::get('/deconsignation/pdf/{xnum_0}', [DeconsignationController::class, 'previewPDF']);
    Route::get('/deconsignation/demande/pdf/{xnum_0}', function($xnum_0) {
        return app(App\Http\Controllers\DeconsignationController::class)->generatePDF($xnum_0, 'demande');
    });
});

// CAISSIER, CAISSIERE: /depot-de-caution , /etat/caution, /recuperation , /flux-interne/deconsignation , /flux-interne/situation-client
Route::middleware(['api.token', 'role_permission:ADMIN,CAISSIER,CAISSIERE'])->group(function () {
    Route::get('/xcaution', [XcautionController::class, 'index']); // depot-de-caution
    Route::post('/xcaution', [XcautionController::class, 'store']);
    Route::get('/xcaution/cin-by-client/{clientCode}', [XcautionController::class, 'getCinByClient']); // get CIN by client - MUST be before parameterized routes
    Route::get('/xcaution/{xnum_0}', [XcautionController::class, 'show']); // get single caution
    Route::put('/xcaution/{xnum_0}', [XcautionController::class, 'update']); // validate caution
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

    // État PDF generation for AGENT_ORDONNANCEMENT
    Route::post('/consignations/generate-range-pdf', [ConsignationController::class, 'generateRangePDF'])->name('consignations.generate-range-pdf');
    Route::get('/consignations/generate-range-pdf', [ConsignationController::class, 'generateRangePDF'])->name('consignations.generate-range-pdf-get');
    Route::post('/deconsignations/generate-range-pdf', [DeconsignationController::class, 'generateRangePDF'])->name('deconsignations.generate-range-pdf');
    Route::get('/deconsignations/generate-range-pdf', [DeconsignationController::class, 'generateRangePDF'])->name('deconsignations.generate-range-pdf-get');
});

// CHEF_PARC: /flux-interne/deconsignation
Route::middleware(['api.token', 'role_permission:ADMIN,CHEF_PARC'])->group(function () {
    Route::get('/flux-interne/deconsignation', [DeconsignationController::class, 'index']);
});
