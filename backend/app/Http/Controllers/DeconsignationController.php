<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Deconsignation;
use App\Models\Csolde;
use App\Models\Consignation;
use App\Models\Xcaution;
use App\Models\Restitution;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use Carbon\Carbon;

class DeconsignationController extends Controller
{    /**
     * Display a listing of deconsignations.
     */
    public function index(): JsonResponse
{
    try {
        // Récupère les déconsignations avec pagination (5 par page)
        $deconsignations = Deconsignation::orderBy('created_at', 'desc')
            ->paginate(5);

        return response()->json($deconsignations);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Erreur lors de la récupération des déconsignations',
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
}

    /**
     * Store a newly created deconsignation.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'xsite_0' => 'required|string|max:255',
                'xclient_0' => 'required|string|max:255',
                'xraison_0' => 'nullable|string|max:255',
                'xcamion_0' => 'nullable|string|max:255',      // Changed to nullable - Matricule can be empty
                'xdate_0' => 'required|string|date_format:d/m/Y', // Required, validates DD/MM/YYYY format
                'xheure_0' => 'required|string|max:10',        // Added xheure_0
                'palette_ramene' => 'nullable|integer|min:0',  // Changed to nullable and min:0
                'palette_a_deconsigner' => 'required|integer|min:1',  // Updated field name
                'palette_deconsignees' => 'nullable|integer|min:0',   // Updated field name
                'xvalsta_0' => 'nullable|integer|in:1,2',
            ]);

            // Apply business logic validations
            $validationResult = $this->validateDeconsignationLogic($validatedData);
            if (!$validationResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $validationResult['message'],
                    'error_type' => $validationResult['error_type'] ?? 'validation_error',
                    'balance_info' => $validationResult['balance_info'] ?? null
                ], 422);
            }

            // Convert date from DD/MM/YYYY to YYYY-MM-DD for database storage
            $validatedData['xdate_0'] = Carbon::createFromFormat('d/m/Y', $validatedData['xdate_0'])->format('Y-m-d');

            // Set default xvalsta_0 to 1 (non-validated) if not provided
            if (!isset($validatedData['xvalsta_0']) || $validatedData['xvalsta_0'] === null) {
                $validatedData['xvalsta_0'] = 1;
            }

            // Generate unique xnum_0 for new deconsignation using site code
            $xnum_0 = $this->generateUniqueXnum($validatedData['xsite_0']);

            // Add the generated xnum_0 to the validated data
            $validatedData['xnum_0'] = $xnum_0;

            $deconsignation = Deconsignation::create($validatedData);

            // Step 1: AGENT_ORDONNANCEMENT creates deconsignation -> notify CHEF_PARC
            try {
                $fromUserId = $request->user() ? $request->user()->USER_ID : null;
                NotificationService::deconsignationCreatedByAgent($deconsignation, $fromUserId);
                Log::info("Notification sent to CHEF_PARC for new deconsignation: {$deconsignation->xnum_0}");
            } catch (\Exception $e) {
                Log::error("Error sending notification for deconsignation creation: " . $e->getMessage());
                // Don't fail the creation just because of notification error
            }

            // Trigger comprehensive balance recalculation if deconsignation is created as validated
            if (isset($validatedData['xvalsta_0']) && $validatedData['xvalsta_0'] == 2) {
                try {
                    Csolde::recalculateBalance($deconsignation->xclient_0, $deconsignation->xsite_0);
                    Log::info("Balance recalculated after validated deconsignation creation: Client={$deconsignation->xclient_0}, Site={$deconsignation->xsite_0}");
                } catch (\Exception $e) {
                    Log::error("Error recalculating balance after validated deconsignation creation: " . $e->getMessage());
                }
            }

            // Temporarily remove relationships to avoid errors
            // $deconsignation->load(['facility', 'customer']);

            return response()->json([
                'success' => true,
                'message' => 'Déconsignation créée avec succès',
                'data' => $deconsignation,
                'info_message' => $validationResult['info_message'] ?? null
            ], 201);
        } catch (ValidationException $e) {
            Log::error('Validation error in deconsignation creation', [
                'errors' => $e->errors(),
                'message' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Exception in deconsignation creation', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'message' => 'Erreur lors de la création de la déconsignation',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Display the specified deconsignation.
     */
    public function show(string $xnum_0): JsonResponse
    {
        try {
            $deconsignation = Deconsignation::with(['facility', 'customer'])
                ->where('xnum_0', $xnum_0)
                ->first();

            if (!$deconsignation) {
                return response()->json([
                    'message' => 'Déconsignation non trouvée'
                ], 404);
            }

            return response()->json($deconsignation);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération de la déconsignation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified deconsignation.
     */
    public function update(Request $request, string $xnum_0): JsonResponse
    {
        try {
            $deconsignation = Deconsignation::where('xnum_0', $xnum_0)->first();            if (!$deconsignation) {
                return response()->json([
                    'message' => 'Déconsignation non trouvée'
                ], 404);
            }

            // Check if this is a validation request (updating xvalsta_0 to 2)
            $isValidationRequest = $request->has('xvalsta_0') && $request->xvalsta_0 == 2;

            if ($isValidationRequest) {
                // For validation requests, validate required fields
                $validator = Validator::make($request->all(), [
                    'xcamion_0' => 'required|string|max:255',
                    'palette_ramene' => 'required|integer|min:1', // Must be > 0
                    'palette_a_deconsigner' => 'required|integer|min:1',
                    'palette_deconsignees' => 'nullable|integer|min:0',
                    'xvalsta_0' => 'required|in:1,2'
                ]);

                if ($validator->fails()) {
                    return response()->json(['errors' => $validator->errors()], 422);
                }

                // Apply business logic validations for validation requests
                $validationData = [
                    'xclient_0' => $deconsignation->xclient_0,
                    'xsite_0' => $deconsignation->xsite_0,
                    'palette_ramene' => $request->palette_ramene,
                    'palette_a_deconsigner' => $request->palette_a_deconsigner,
                    'palette_deconsignees' => $request->palette_deconsignees ?? 0
                ];

                $validationResult = $this->validateDeconsignationLogic($validationData);
                if (!$validationResult['success']) {
                    return response()->json([
                        'success' => false,
                        'message' => $validationResult['message'],
                        'error_type' => $validationResult['error_type'] ?? 'validation_error',
                        'balance_info' => $validationResult['balance_info'] ?? null
                    ], 422);
                }

                // Update all fields including validation status
                $deconsignation->xcamion_0 = $request->xcamion_0;
                $deconsignation->palette_ramene = $request->palette_ramene ?? 0;
                $deconsignation->palette_a_deconsigner = $request->palette_a_deconsigner;
                $deconsignation->palette_deconsignees = $request->palette_deconsignees ?? 0;
                $deconsignation->xvalsta_0 = $request->xvalsta_0;
                $deconsignation->save();

                // Trigger comprehensive balance recalculation when deconsignation is validated
                if ($request->xvalsta_0 == 2) {
                    try {
                        Csolde::recalculateBalance($deconsignation->xclient_0, $deconsignation->xsite_0);
                        Log::info("Balance recalculated after deconsignation validation: Client={$deconsignation->xclient_0}, Site={$deconsignation->xsite_0}");
                    } catch (\Exception $e) {
                        Log::error("Error recalculating balance after deconsignation validation: " . $e->getMessage());
                        // Don't fail the validation just because of balance calculation error
                    }

                    // Step 3: CAISSIERE/CAISSIER validates deconsignation -> notify AGENT_ORDONNANCEMENT
                    try {
                        $fromUserId = $request->user() ? $request->user()->USER_ID : null;
                        NotificationService::deconsignationValidated($deconsignation, $fromUserId);
                        Log::info("Notification sent to AGENT_ORDONNANCEMENT for deconsignation validation: {$deconsignation->xnum_0}");
                    } catch (\Exception $e) {
                        Log::error("Error sending notification for deconsignation validation: " . $e->getMessage());
                        // Don't fail the validation just because of notification error
                    }
                }

                return response()->json(['message' => 'Déconsignation validée avec succès.']);
            } else {
                // For regular edits, only allow update if not validated
                if ($deconsignation->xvalsta_0 == 2) {
                    return response()->json([
                        'message' => 'Modification interdite : déconsignation validée'
                    ], 403);
                }

                // Validate only the editable fields
                $validator = Validator::make($request->all(), [
                    'xsite_0' => 'nullable|string|max:255',
                    'xclient_0' => 'nullable|string|max:255',
                    'xraison_0' => 'nullable|string|max:255',
                    'xcamion_0' => 'nullable|string|max:255',
                    'xdate_0' => 'nullable|string|date_format:d/m/Y',
                    'xheure_0' => 'nullable|string|max:10',
                    'palette_ramene' => 'nullable|integer|min:1', // Must be > 0
                    'palette_a_deconsigner' => 'nullable|integer|min:1',
                    'palette_deconsignees' => 'nullable|integer|min:0'
                ]);

                if ($validator->fails()) {
                    return response()->json(['errors' => $validator->errors()], 422);
                }

                // If key business fields are being updated, validate business logic
                if ($request->has('palette_ramene') || $request->has('palette_a_deconsigner') || $request->has('palette_deconsignees')) {
                    $validationData = [
                        'xclient_0' => $request->get('xclient_0', $deconsignation->xclient_0),
                        'xsite_0' => $request->get('xsite_0', $deconsignation->xsite_0),
                        'palette_ramene' => $request->get('palette_ramene', $deconsignation->palette_ramene),
                        'palette_a_deconsigner' => $request->get('palette_a_deconsigner', $deconsignation->palette_a_deconsigner),
                        'palette_deconsignees' => $request->get('palette_deconsignees', $deconsignation->palette_deconsignees)
                    ];

                    $validationResult = $this->validateDeconsignationLogic($validationData);
                    if (!$validationResult['success']) {
                        return response()->json([
                            'success' => false,
                            'message' => $validationResult['message'],
                            'error_type' => $validationResult['error_type'] ?? 'validation_error',
                            'balance_info' => $validationResult['balance_info'] ?? null
                        ], 422);
                    }
                }

                // Convert date from DD/MM/YYYY to YYYY-MM-DD for database storage if provided
                if ($request->has('xdate_0') && !empty($request->xdate_0)) {
                    $deconsignation->xdate_0 = Carbon::createFromFormat('d/m/Y', $request->xdate_0)->format('Y-m-d');
                }

                // Only update the allowed fields
                if ($request->has('xsite_0')) $deconsignation->xsite_0 = $request->xsite_0;
                if ($request->has('xclient_0')) $deconsignation->xclient_0 = $request->xclient_0;
                if ($request->has('xraison_0')) $deconsignation->xraison_0 = $request->xraison_0;
                if ($request->has('xcamion_0')) $deconsignation->xcamion_0 = $request->xcamion_0;
                if ($request->has('xheure_0')) $deconsignation->xheure_0 = $request->xheure_0;
                if ($request->has('palette_ramene')) $deconsignation->palette_ramene = $request->palette_ramene;
                if ($request->has('palette_a_deconsigner')) $deconsignation->palette_a_deconsigner = $request->palette_a_deconsigner;
                if ($request->has('palette_deconsignees')) $deconsignation->palette_deconsignees = $request->palette_deconsignees;

                $deconsignation->save();

                // Step 2: CHEF_PARC fills conforming pallets -> notify CAISSIERE/CAISSIER
                // Only send notification if palette_deconsignees was filled and it's > 0
                if ($request->has('palette_deconsignees') && $request->palette_deconsignees > 0) {
                    try {
                        $fromUserId = $request->user() ? $request->user()->USER_ID : null;
                        NotificationService::deconsignationPalettesFilledByChef($deconsignation, $fromUserId);
                        Log::info("Notification sent to CAISSIERE/CAISSIER for deconsignation palettes filled: {$deconsignation->xnum_0}");
                    } catch (\Exception $e) {
                        Log::error("Error sending notification for deconsignation palettes filled: " . $e->getMessage());
                        // Don't fail the update just because of notification error
                    }
                }

                return response()->json(['message' => 'Déconsignation modifiée avec succès.']);
            }

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour de la déconsignation',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Remove the specified deconsignation.
     */
    public function destroy(string $xnum_0): JsonResponse
    {
        try {
            $deconsignation = Deconsignation::where('xnum_0', $xnum_0)->first();            if (!$deconsignation) {
                return response()->json([
                    'message' => 'Déconsignation non trouvée'
                ], 404);
            }

            // Check if deconsignation is validated (XVALSTA_0 = 2) - prevent deletion
            if ($deconsignation->xvalsta_0 == 2) {
                return response()->json([
                    'message' => 'Suppression interdite : déconsignation validée'
                ], 403);
            }

            $deconsignation->delete();

            return response()->json([
                'message' => 'Déconsignation supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de la déconsignation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate a unique xnum_0 for new deconsignation.
     * Format: DS{SITE}{YEAR}{MONTH}{DAY}-{sequence}
     * Example: DS1250703-0001
     */
    private function generateUniqueXnum(string $siteCode = ''): string
    {
        $date = now();
        $year = $date->format('y');  // 2-digit year
        $month = $date->format('m');
        $day = $date->format('d');

        do {
            // Get the last deconsignation number for the current month only
            $lastDeconsignation = Deconsignation::whereYear('created_at', $date->year)
                                  ->whereMonth('created_at', $date->month)
                                  ->orderBy('created_at', 'desc')
                                  ->first();

            // Start sequence at 1 for each new month, or increment from last sequence
            $sequence = 1;
            if ($lastDeconsignation) {
                // Extract the sequence number from the last deconsignation
                $matches = [];
                if (preg_match('/-(\d{4})$/', $lastDeconsignation->xnum_0, $matches)) {
                    $sequence = intval($matches[1]) + 1;
                }
            }

            // Format: DS{SITE}{YEAR}{MONTH}{DAY}-{sequence}
            // Example: DS1250703-0001 (DS + site1 + 25 + 07 + 03 + - + 0001)
            $xnum_0 = sprintf("DS%s%s%s%s-%04d",
                $siteCode,       // Site code
                $year,           // 2-digit year
                $month,          // Month
                $day,            // Day
                $sequence        // 4-digit sequence number
            );

            // Check if this number already exists (unlikely but safe)
            $exists = Deconsignation::where('xnum_0', $xnum_0)->exists();

            // If exists, increment sequence and try again
            if ($exists) {
                $sequence++;
            }

        } while ($exists);

        return $xnum_0;
    }

    /**
     * Validate deconsignation business logic
     */
    private function validateDeconsignationLogic(array $data): array
    {
        $client = $data['xclient_0'];
        $site = $data['xsite_0'];
        $paletteRamene = $data['palette_ramene'];
        $paletteADeconsigner = $data['palette_a_deconsigner'];
        $paletteDeconsignees = $data['palette_deconsignees'] ?? 0;

        // 1. Validation: Le nombre de palettes ramenées ne peut pas être égal à 0
        if ($paletteRamene <= 0) {
            return [
                'success' => false,
                'message' => 'Le nombre de palettes ramenées ne peut pas être égal à zéro.',
                'error_type' => 'palette_ramene_invalid'
            ];
        }

        // 2. Validation: Le nombre de palettes à déconsigner doit être inférieur ou égal au nombre de palettes ramenées
        if ($paletteADeconsigner > $paletteRamene) {
            return [
                'success' => false,
                'message' => 'Le nombre de palettes à déconsigner doit être inférieur ou égal au nombre de palettes ramenées.',
                'error_type' => 'palette_a_deconsigner_exceed_ramene',
                'validation_info' => [
                    'palette_ramene' => $paletteRamene,
                    'palette_a_deconsigner' => $paletteADeconsigner
                ]
            ];
        }

        // 3. Validation: Le nombre de palettes déconsignées doit être inférieur ou égal au nombre de palettes à déconsigner
        if ($paletteDeconsignees > $paletteADeconsigner) {
            return [
                'success' => false,
                'message' => 'Veuillez noter que le nombre de palettes déconsignées ne doit pas dépasser le nombre de palettes à déconsigner.',
                'error_type' => 'palette_deconsignees_exceed_a_deconsigner',
                'validation_info' => [
                    'palette_a_deconsigner' => $paletteADeconsigner,
                    'palette_deconsignees' => $paletteDeconsignees
                ]
            ];
        }

        // 4. Validation: Le nombre de palettes à déconsigner doit être inférieur ou égal au nombre de palettes consignées validées
        // Get total validated consigned palettes for this client/site
        $totalConsignedValidated = DB::table('xconsignation')
                                    ->where('xclient_0', $client)
                                    ->where('xsite_0', $site)
                                    ->where('xvalsta_0', 2) // Only validated consignations
                                    ->sum('palette_consignees');

        // Get total already deconsigned palettes for this client/site
        $totalAlreadyDeconsigned = DB::table('xdeconsignation')
                                    ->where('xclient_0', $client)
                                    ->where('xsite_0', $site)
                                    ->where('xvalsta_0', 2) // Only validated deconsignations
                                    ->sum('palette_deconsignees');

        // Available palettes to deconsign = total consigned validated - total already deconsigned
        $availablePalettesToDeconsign = $totalConsignedValidated - $totalAlreadyDeconsigned;

        if ($paletteADeconsigner > $availablePalettesToDeconsign) {
            return [
                'success' => false,
                'message' => 'Le nombre de palettes à déconsigner doit être inférieur ou égal au nombre de palettes consignées validées disponibles.',
                'error_type' => 'palette_a_deconsigner_exceed_available',
                'validation_info' => [
                    'palette_a_deconsigner' => $paletteADeconsigner,
                    'total_consigned_validated' => $totalConsignedValidated,
                    'total_already_deconsigned' => $totalAlreadyDeconsigned,
                    'available_to_deconsign' => $availablePalettesToDeconsign
                ]
            ];
        }

        // Validation réussie
        return [
            'success' => true,
            'message' => 'Validation réussie.',
            'validation_info' => [
                'palette_ramene' => $paletteRamene,
                'palette_a_deconsigner' => $paletteADeconsigner,
                'palette_deconsignees' => $paletteDeconsignees,
                'total_consigned_validated' => $totalConsignedValidated,
                'total_already_deconsigned' => $totalAlreadyDeconsigned,
                'available_to_deconsign' => $availablePalettesToDeconsign
            ]
        ];
    }

    /**
     * Validate deconsignation data before saving
     */
    public function validateDeconsignation(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'xclient_0' => 'required|string',
                'xsite_0' => 'required|string',
                'palette_ramene' => 'required|integer|min:1',
                'palette_a_deconsigner' => 'required|integer|min:1',
                'palette_deconsignees' => 'nullable|integer|min:0'
            ]);

            $validationData = [
                'xclient_0' => $request->xclient_0,
                'xsite_0' => $request->xsite_0,
                'palette_ramene' => $request->palette_ramene,
                'palette_a_deconsigner' => $request->palette_a_deconsigner,
                'palette_deconsignees' => $request->palette_deconsignees ?? 0
            ];

            $validationResult = $this->validateDeconsignationLogic($validationData);

            if (!$validationResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $validationResult['message'],
                    'error_type' => $validationResult['error_type'],
                    'balance_info' => $validationResult['balance_info'] ?? null
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'Validation réussie',
                'info_message' => $validationResult['info_message'] ?? null,
                'balance_info' => $validationResult['balance_info'] ?? null
            ]);

        } catch (\Exception $e) {
            Log::error("Error in validateDeconsignation: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la validation: ' . $e->getMessage()
            ], 500);
        }
    }

   public function generatePDF($xnum_0, $type = 'bon')
{
    try {
        $deconsignation = Deconsignation::where('xnum_0', $xnum_0)->firstOrFail();

        $client = $deconsignation->xclient_0;
        $site = $deconsignation->xsite_0;
        $createdAt = $deconsignation->created_at;

        // Récupérer toutes les opérations validées (xvalsta_0 = 2)
        $operations = collect()
            ->merge(Xcaution::where('xclient_0', $client)->where('xsite_0', $site)->where('xvalsta_0', 2)->get()
                ->map(fn($op) => (object)[
                    'type' => 'Caution',
                    'created_at' => $op->created_at,
                    'montant' => $op->montant,
                ]))
            ->merge(Consignation::where('xclient_0', $client)->where('xsite_0', $site)->where('xvalsta_0', 2)->get()
                ->map(fn($op) => (object)[
                    'type' => 'Consignation',
                    'created_at' => $op->created_at,
                    'palette_a_consigner' => $op->palette_a_consigner,
                ]))
           ->merge(Deconsignation::where('xclient_0', $client)
    ->where('xsite_0', $site)
    ->where(function ($query) use ($xnum_0) {
        $query->where('xvalsta_0', 2)
              ->orWhere('xnum_0', $xnum_0); // ✅ Inclure le bon courant même s’il est non validé
    })->get()
    ->map(fn($op) => (object)[
        'type' => 'Déconsignation',
        'xnum_0' => $op->xnum_0,
        'created_at' => $op->created_at,
        'palette_deconsignees' => $op->palette_deconsignees,
        'is_current' => (string)$op->xnum_0 === (string)$xnum_0,
    ]))

            ->merge(Restitution::where('xclient_0', $client)->where('xsite_0', $site)->where('xvalsta_0', 2)->get()
                ->map(fn($op) => (object)[
                    'type' => 'Restitution',
                    'created_at' => $op->created_at,
                    'montant' => $op->montant,
                ]));

        // Trier toutes les opérations par created_at croissant
        $sortedOps = $operations->sortBy('created_at')->values();

        // Initialiser les cumuls
        $cumulCaution = 0;
        $cumulConsignees = 0;
        $cumulDeconsignees = 0;
        $cumulRestitution = 0;

        $cautionBefore = 0;
        $cautionAfter = 0;

        // Boucle sur les opérations triées
        foreach ($sortedOps as $op) {
    $isCurrent = $op->type === 'Déconsignation' && property_exists($op, 'is_current') && $op->is_current;

    // 🔹 Calculer le caution_before juste avant le bon courant
    if ($isCurrent) {
        $cautionBefore = $cumulCaution - $cumulConsignees + $cumulDeconsignees - $cumulRestitution;
        continue; // ❌ Ne pas inclure cette déconsignation dans les cumuls
    }

    // ✅ Cumuls (uniquement pour les autres opérations validées)
    if ($op->type === 'Caution') {
        $cumulCaution += $op->montant ?? 0;
    } elseif ($op->type === 'Consignation') {
        $cumulConsignees += ($op->palette_a_consigner ?? 0) * 100;
    } elseif ($op->type === 'Déconsignation') {
        $cumulDeconsignees += ($op->palette_deconsignees ?? 0) * 100;
    } elseif ($op->type === 'Restitution') {
        $cumulRestitution += $op->montant ?? 0;
    }
}
if ($deconsignation->xvalsta_0 == 2) {
    $cautionAfter = $cautionBefore + (($deconsignation->palette_deconsignees ?? 0) * 100);
} else {
    $cautionAfter = $cautionBefore;
}


// Palettes consignées AVANT la déconsignation actuelle
$beforePalettesConsignees = Consignation::where('xclient_0', $client)
    ->where('xsite_0', $site)
    ->where('xvalsta_0', 2)
    ->where('created_at', '<', $createdAt)
    ->sum('palette_a_consigner');

// Palettes déjà déconsignées AVANT cette déconsignation
$beforePalettesDeconsignees = Deconsignation::where('xclient_0', $client)
    ->where('xsite_0', $site)
    ->where('xvalsta_0', 2)
    ->where('created_at', '<', $createdAt)
    ->sum('palette_deconsignees');

// Solde avant cette déconsignation
$beforePalettes = $beforePalettesConsignees - $beforePalettesDeconsignees;

// Palettes dans le bon actuel (si présentes)
$currentBonPalettes = isset($deconsignation) && $deconsignation->palette_deconsignees !== null
    ? (int) $deconsignation->palette_deconsignees
    : 0;

// Solde après cette déconsignation
$afterPalettes = $beforePalettes - $currentBonPalettes;

        // Vue PDF
        $view = ($type === 'demande') ? 'pdf.demande-deconsignation' : 'pdf.bon-deconsignation';

        return PDF::loadView($view, [
            'deconsignation' => $deconsignation,
            'before_palettes' => $beforePalettes,
            'after_palettes' => $afterPalettes,
            'caution_before' => round($cautionBefore / 100, 2),
            'caution_after' => round($cautionAfter / 100, 2),
        ])->stream("deconsignation_{$type}_{$xnum_0}.pdf");

    } catch (\Exception $e) {
        return response('Erreur lors de la génération du PDF: ' . $e->getMessage(), 500);
    }
}

    /**
     * Preview PDF for a specific deconsignation
     */
    public function previewPDF($xnum_0)
    {
        try {
            $deconsignation = Deconsignation::where('xnum_0', $xnum_0)->firstOrFail();

            $client = $deconsignation->xclient_0;
            $site = $deconsignation->xsite_0;
            $createdAt = $deconsignation->created_at;

            // Récupérer toutes les opérations validées (xvalsta_0 = 2)
            $operations = collect()
                ->merge(Xcaution::where('xclient_0', $client)->where('xsite_0', $site)->where('xvalsta_0', 2)->get()
                    ->map(fn($op) => (object)[
                        'type' => 'Caution',
                        'created_at' => $op->created_at,
                        'montant' => $op->montant,
                    ]))
                ->merge(Consignation::where('xclient_0', $client)->where('xsite_0', $site)->where('xvalsta_0', 2)->get()
                    ->map(fn($op) => (object)[
                        'type' => 'Consignation',
                        'created_at' => $op->created_at,
                        'palette_a_consigner' => $op->palette_a_consigner,
                    ]))
               ->merge(Deconsignation::where('xclient_0', $client)
        ->where('xsite_0', $site)
        ->where(function ($query) use ($xnum_0) {
            $query->where('xvalsta_0', 2)
                  ->orWhere('xnum_0', $xnum_0); // ✅ Inclure le bon courant même s'il est non validé
        })->get()
        ->map(fn($op) => (object)[
            'type' => 'Déconsignation',
            'xnum_0' => $op->xnum_0,
            'created_at' => $op->created_at,
            'palette_deconsignees' => $op->palette_deconsignees,
            'is_current' => (string)$op->xnum_0 === (string)$xnum_0,
        ]))

                ->merge(Restitution::where('xclient_0', $client)->where('xsite_0', $site)->where('xvalsta_0', 2)->get()
                    ->map(fn($op) => (object)[
                        'type' => 'Restitution',
                        'created_at' => $op->created_at,
                        'montant' => $op->montant,
                    ]));

            // Trier toutes les opérations par created_at croissant
            $sortedOps = $operations->sortBy('created_at')->values();

            // Initialiser les cumuls
            $cumulCaution = 0;
            $cumulConsignees = 0;
            $cumulDeconsignees = 0;
            $cumulRestitution = 0;

            $cautionBefore = 0;
            $cautionAfter = 0;

            // Boucle sur les opérations triées
            foreach ($sortedOps as $op) {
                $isCurrent = $op->type === 'Déconsignation' && property_exists($op, 'is_current') && $op->is_current;

                // 🔹 Calculer le caution_before juste avant le bon courant
                if ($isCurrent) {
                    $cautionBefore = $cumulCaution - $cumulConsignees + $cumulDeconsignees - $cumulRestitution;
                    continue; // ❌ Ne pas inclure cette déconsignation dans les cumuls
                }

                // ✅ Cumuls (uniquement pour les autres opérations validées)
                if ($op->type === 'Caution') {
                    $cumulCaution += $op->montant ?? 0;
                } elseif ($op->type === 'Consignation') {
                    $cumulConsignees += ($op->palette_a_consigner ?? 0) * 100;
                } elseif ($op->type === 'Déconsignation') {
                    $cumulDeconsignees += ($op->palette_deconsignees ?? 0) * 100;
                } elseif ($op->type === 'Restitution') {
                    $cumulRestitution += $op->montant ?? 0;
                }
            }

            if ($deconsignation->xvalsta_0 == 2) {
                $cautionAfter = $cautionBefore + (($deconsignation->palette_deconsignees ?? 0) * 100);
            } else {
                $cautionAfter = $cautionBefore;
            }

            // Palettes consignées AVANT la déconsignation actuelle
            $beforePalettesConsignees = Consignation::where('xclient_0', $client)
                ->where('xsite_0', $site)
                ->where('xvalsta_0', 2)
                ->where('created_at', '<', $createdAt)
                ->sum('palette_a_consigner');

            // Palettes déjà déconsignées AVANT cette déconsignation
            $beforePalettesDeconsignees = Deconsignation::where('xclient_0', $client)
                ->where('xsite_0', $site)
                ->where('xvalsta_0', 2)
                ->where('created_at', '<', $createdAt)
                ->sum('palette_deconsignees');

            // Solde avant cette déconsignation
            $beforePalettes = $beforePalettesConsignees - $beforePalettesDeconsignees;

            // Palettes dans le bon actuel (si présentes)
            $currentBonPalettes = isset($deconsignation) && $deconsignation->palette_deconsignees !== null
                ? (int) $deconsignation->palette_deconsignees
                : 0;

            // Solde après cette déconsignation
            $afterPalettes = $beforePalettes - $currentBonPalettes;

            // Charger la vue PDF
            $pdf = PDF::loadView('pdf.bon-deconsignation', [
                'deconsignation' => $deconsignation,
                'before_palettes' => $beforePalettes,
                'after_palettes' => $afterPalettes,
                'caution_before' => round($cautionBefore / 100, 2),
                'caution_after' => round($cautionAfter / 100, 2),
            ]);

            $pdf->setPaper('a4', 'portrait');
            $pdf->setOption('enable-local-file-access', true);
            $pdf->setOption('isRemoteEnabled', true);

            return $pdf->stream();
        } catch (\Exception $e) {
            Log::error('PDF Preview Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la prévisualisation du PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate range PDF for multiple deconsignations
     */
    public function generateRangePDF(Request $request)
    {
        try {
            $valeurDebut = $request->query('valeur_debut');
            $valeurFin = $request->query('valeur_fin');
            $codeEtat = $request->query('code_etat', 'PLTDECONS');

            if (!$valeurDebut || !$valeurFin) {
                return response('Paramètres manquants: valeur_debut et valeur_fin sont requis', 400);
            }

            // Get deconsignations in the specified range that are validated
            $deconsignations = Deconsignation::where('xvalsta_0', 2) // Only validated
                ->where('xnum_0', '>=', $valeurDebut)
                ->where('xnum_0', '<=', $valeurFin)
                ->orderBy('xnum_0')
                ->get();

            if ($deconsignations->isEmpty()) {
                return response('Aucune déconsignation validée trouvée dans cette plage', 404);
            }

            // Generate PDF with multiple deconsignations using previous design (individual receipts)
            $pdf = PDF::loadView('pdf.bon-deconsignation-multiple', [
                'deconsignations' => $deconsignations,
                'valeur_debut' => $valeurDebut,
                'valeur_fin' => $valeurFin,
                'code_etat' => $codeEtat,
                'description' => 'État des Déconsignations - ' . $codeEtat,
                'date_generation' => now()->format('d/m/Y H:i:s'),
            ]);

            $pdf->setPaper('a4', 'portrait');
            $pdf->setOption('enable-local-file-access', true);
            $pdf->setOption('isRemoteEnabled', true);

            return $pdf->stream("etat_deconsignations_{$valeurDebut}_to_{$valeurFin}.pdf");

        } catch (\Exception $e) {
            Log::error('Range PDF Generation Error: ' . $e->getMessage());
            return response('Erreur lors de la génération du PDF: ' . $e->getMessage(), 500);
        }
    }

}
