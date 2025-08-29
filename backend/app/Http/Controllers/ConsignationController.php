<?php

namespace App\Http\Controllers;

use App\Models\Consignation;
use App\Models\Csolde;
use App\Models\Xcaution;
use App\Models\Deconsignation;
use App\Models\Restitution;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;
class ConsignationController extends Controller
{
    /**
     * Display a listing of consignations.
     */
    public function index(Request $request): JsonResponse
{
    try {
        $query = Consignation::with(['facility', 'customer']);

        // Filtre de recherche
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('xnum_0', 'like', "%{$search}%")
                  ->orWhere('xclient_0', 'like', "%{$search}%")
                  ->orWhere('xraison_0', 'like', "%{$search}%");
            });
        }

        // Filtre statut
        if ($request->has('status') && in_array($request->status, ['1', '2'])) {
            $query->where('xvalsta_0', $request->status);
        }

        // Filtre site et client
        if ($request->has('site') && $request->site != '') {
            $query->where('xsite_0', $request->site);
        }

        if ($request->has('client') && $request->client != '') {
            $query->where('xclient_0', $request->client);
        }

        // Filtre par date
        if ($request->has('date_start') && $request->date_start != '') {
            $query->where('xdate_0', '>=', $request->date_start);
        }

        if ($request->has('date_end') && $request->date_end != '') {
            $query->where('xdate_0', '<=', $request->date_end);
        }

        // Tri
        $query->orderBy('xdate_0', 'desc')->orderBy('xnum_0', 'desc');

        // Pagination
        $consignations = $request->has('per_page')
            ? $query->paginate($request->per_page)
            : $query->get();

        // Récupérer la collection si pagination
        $items = $consignations instanceof \Illuminate\Pagination\AbstractPaginator
            ? $consignations->getCollection()
            : $consignations;

        // Encodage UTF-8
        $items->transform(function ($item) {
            foreach ($item->getAttributes() as $key => $value) {
                if (is_string($value)) {
                    $item->$key = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                }
            }

            foreach (['facility', 'customer'] as $relation) {
                if ($item->relationLoaded($relation) && $item->$relation) {
                    if ($item->$relation instanceof \Illuminate\Support\Collection) {
                        foreach ($item->$relation as $relItem) {
                            foreach ($relItem->getAttributes() as $key => $value) {
                                if (is_string($value)) {
                                    $relItem->$key = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                                }
                            }
                        }
                    } else {
                        foreach ($item->$relation->getAttributes() as $key => $value) {
                            if (is_string($value)) {
                                $item->$relation->$key = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                            }
                        }
                    }
                }
            }

            return $item;
        });

        // Si pagination, mettre à jour la collection
        if ($consignations instanceof \Illuminate\Pagination\AbstractPaginator) {
            $consignations->setCollection($items);
        }

        return response()->json($consignations);

    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Erreur lors de la récupération des consignations',
            'error' => $e->getMessage()
        ], 500);
    }
}


    /**
     * Store a newly created consignation.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'xnum_0' => 'nullable|string|max:255|unique:xconsignation,xnum_0',
                'xsite_0' => 'required|string|max:255',
                'xclient_0' => 'required|string|max:255',
                'xraison_0' => 'nullable|string|max:255',
                'xbp_0' => 'required|string|max:255',
                'xcamion_0' => 'required|string|max:255',
                'xdate_0' => 'required|string|date_format:d/m/Y',
                'xheure_0' => 'nullable|string|max:10',
                'palette_ramene' => 'nullable|integer|min:0',
                'palette_a_consigner' => 'required|integer|min:0',
                'palette_consignees' => 'nullable|integer|min:0',
                'xvalsta_0' => 'nullable|integer|in:1,2',
            ]);

            $validatedData['xdate_0'] = Carbon::createFromFormat('d/m/Y', $validatedData['xdate_0'])->format('Y-m-d');

            // Ensure balance is calculated for this client/site before checking
            try {
                Csolde::recalculateBalance($validatedData['xclient_0'], $validatedData['xsite_0']);
                Log::info("Balance recalculated before consignation validation: Client={$validatedData['xclient_0']}, Site={$validatedData['xsite_0']}");
            } catch (\Exception $e) {
                Log::error("Error recalculating balance before consignation validation: " . $e->getMessage());
            }

            $currentBalance = DB::table('csolde')
                                ->where('codeClient', $validatedData['xclient_0'])
                                ->where('site', $validatedData['xsite_0'])
                                ->value('solde') ?? 0;
            $requiredAmount = $validatedData['palette_a_consigner'] * 100;

            // Only check solde if there are actually palettes to consign
            if ($validatedData['palette_a_consigner'] > 0 && $requiredAmount > $currentBalance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solde insuffisant',
                    'error' => 'Solde insuffisant',
                    'balance_info' => [
                        'current_balance' => $currentBalance,
                        'required_amount' => $requiredAmount,
                        'missing_amount' => $requiredAmount - $currentBalance,
                        'client' => $validatedData['xclient_0'],
                        'site' => $validatedData['xsite_0']
                    ]
                ], 400);
            }

            $consignation = Consignation::create($validatedData);

            if (isset($validatedData['xvalsta_0']) && $validatedData['xvalsta_0'] == 2) {
                try {
                    Csolde::recalculateBalance($validatedData['xclient_0'], $validatedData['xsite_0']);
                    Log::info("Balance recalculated after validated consignation creation: Client={$validatedData['xclient_0']}, Site={$validatedData['xsite_0']}");
                } catch (\Exception $e) {
                    Log::error("Error recalculating balance after validated consignation creation: " . $e->getMessage());
                }
            }

            Log::info("Consignation created successfully: Client={$validatedData['xclient_0']}, Site={$validatedData['xsite_0']}");

            return response()->json([
                'success' => true,
                'message' => 'Consignation créée avec succès',
                'data' => $consignation,
                'balance_info' => [
                    'current_balance' => $currentBalance,
                    'required_amount' => $requiredAmount,
                    'new_balance' => $currentBalance,
                    'client' => $validatedData['xclient_0'],
                    'site' => $validatedData['xsite_0']
                ]
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            if (strpos($e->getMessage(), 'Solde insuffisant') !== false) {
                $currentBalance = DB::table('csolde')
                                    ->where('codeClient', $validatedData['xclient_0'])
                                    ->where('site', $validatedData['xsite_0'])
                                    ->value('solde') ?? 0;

                $requiredAmount = $validatedData['palette_a_consigner'] * 100;
                $missingAmount = $requiredAmount - $currentBalance;

                return response()->json([
                    'success' => false,
                    'message' => 'Solde insuffisant',
                    'error' => $e->getMessage(),
                    'balance_info' => [
                        'client' => $validatedData['xclient_0'],
                        'site' => $validatedData['xsite_0'],
                        'current_balance' => $currentBalance,
                        'required_amount' => $requiredAmount,
                        'missing_amount' => $missingAmount
                    ]
                ], 400);
            }

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la consignation',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Display the specified consignation.
     */
    public function show(string $xnum_0): JsonResponse
    {
        try {
            $consignation = Consignation::with(['facility'])
                ->where('xnum_0', $xnum_0)
                ->first();

            if (!$consignation) {
                return response()->json([
                    'message' => 'Consignation non trouvée'
                ], 404);
            }

            return response()->json($consignation);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération de la consignation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified consignation.
     */
    public function update(Request $request, string $xnum_0): JsonResponse
    {
        try {
            $consignation = Consignation::where('xnum_0', $xnum_0)->first();

            if (!$consignation) {
                return response()->json([
                    'message' => 'Consignation non trouvée'
                ], 404);
            }

            $isValidationRequest = $request->has('xvalsta_0') && $request->xvalsta_0 == 2;

            // Always check solde, even for XVALSTA_0 = 1 (non-validated)
            $paletteAConsigner = $request->palette_a_consigner ?? $consignation->palette_a_consigner;
            $client = $consignation->xclient_0;
            $site = $consignation->xsite_0;
            $currentBalance = DB::table('csolde')
                ->where('codeClient', $client)
                ->where('site', $site)
                ->value('solde') ?? 0;
            $requiredAmount = $paletteAConsigner * 100;
            if ($requiredAmount > $currentBalance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solde insuffisant',
                    'error' => 'Solde insuffisant',
                    'balance_info' => [
                        'current_balance' => $currentBalance,
                        'required_amount' => $requiredAmount,
                        'missing_amount' => $requiredAmount - $currentBalance,
                        'client' => $client,
                        'site' => $site
                    ]
                ], 400);
            }

            if ($isValidationRequest) {
                $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                    'xbp_0' => 'required|string|max:255',
                    'xcamion_0' => 'required|string|max:255',
                    'palette_ramene' => 'nullable|integer|min:0',
                    'palette_a_consigner' => 'required|integer|min:1',
                    'palette_consignees' => 'nullable|integer|min:0',
                    'xvalsta_0' => 'required|in:1,2'
                ]);

                if ($validator->fails()) {
                    return response()->json(['errors' => $validator->errors()], 422);
                }

                $consignation->xbp_0 = $request->xbp_0;
                $consignation->xcamion_0 = $request->xcamion_0;
                $consignation->palette_ramene = $request->palette_ramene ?? 0;
                $consignation->palette_a_consigner = $request->palette_a_consigner;
                $consignation->palette_consignees = $request->palette_consignees ?? 0;
                $consignation->xvalsta_0 = $request->xvalsta_0;
                $consignation->save();

                if ($request->xvalsta_0 == 2) {
                    try {
                        Csolde::recalculateBalance($consignation->xclient_0, $consignation->xsite_0);
                        Log::info("Balance recalculated after consignation validation: Client={$consignation->xclient_0}, Site={$consignation->xsite_0}");
                    } catch (\Exception $e) {
                        Log::error("Error recalculating balance after consignation validation: " . $e->getMessage());
                    }
                }

                return response()->json(['message' => 'Consignation validée avec succès.']);
            } else {
                if ($consignation->xvalsta_0 == 2) {
                    return response()->json(['message' => 'Modification interdite : consignation validée.'], 403);
                }

                $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                    'xbp_0' => 'required|string|max:255',
                    'xcamion_0' => 'required|string|max:255',
                    'palette_ramene' => 'nullable|integer|min:0',
                    'palette_a_consigner' => 'required|integer|min:1',
                    'palette_consignees' => 'nullable|integer|min:0'
                ]);

                if ($validator->fails()) {
                    return response()->json(['errors' => $validator->errors()], 422);
                }

                $consignation->xbp_0 = $request->xbp_0;
                $consignation->xcamion_0 = $request->xcamion_0;
                $consignation->palette_ramene = $request->palette_ramene ?? 0;
                $consignation->palette_a_consigner = $request->palette_a_consigner;
                $consignation->palette_consignees = $request->palette_consignees ?? 0;
                $consignation->save();

                return response()->json(['message' => 'Consignation modifiée avec succès.']);
            }

            return response()->json([
                'message' => 'Consignation mise à jour avec succès',
                'data' => $consignation
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour de la consignation',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Remove the specified consignation.
     */
    public function destroy(string $xnum_0): JsonResponse
    {
        try {
            $consignation = Consignation::where('xnum_0', $xnum_0)->first();

            if (!$consignation) {
                return response()->json([
                    'message' => 'Consignation non trouvée'
                ], 404);
            }

            if ($consignation->xvalsta_0 == 2) {
                return response()->json([
                    'message' => 'Suppression interdite : consignation validée'
                ], 403);
            }

            $consignation->delete();

            return response()->json([
                'message' => 'Consignation supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de la consignation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate PDF for a consignation.
     */
    public function generatePDF(string $xnum_0): JsonResponse
    {
        try {
            $consignation = Consignation::with(['facility'])
                ->where('xnum_0', $xnum_0)
                ->first();

            if (!$consignation) {
                return response()->json([
                    'message' => 'Consignation non trouvée'
                ], 404);
            }

            // Calculate caution before and after
            $cautions = Xcaution::where('xclient_0', $consignation->xclient_0)
                               ->where('xsite_0', $consignation->xsite_0)
                               ->where('xvalsta_0', 2)
                               ->sum('montant');

            $caution_before = $cautions / 100; // Convert to palettes (assuming 100 DH per palette)
            $caution_after = $caution_before; // For consignation, caution doesn't change

            // Calculate palettes before and after this consignation
            $consignations_before = Consignation::where('xclient_0', $consignation->xclient_0)
                                                ->where('xsite_0', $consignation->xsite_0)
                                                ->where('xdate_0', '<', $consignation->xdate_0)
                                                ->where('xvalsta_0', 2)
                                                ->sum('palette_consignees');

            $before_palettes = $consignations_before;
            $after_palettes = $before_palettes + ($consignation->palette_consignees ?? 0);

            $pdf = PDF::loadView('pdf.consignation', [
                'consignation' => $consignation,
                'caution_before' => $caution_before,
                'caution_after' => $caution_after,
                'before_palettes' => $before_palettes,
                'after_palettes' => $after_palettes
            ]);

            return response()->json([
                'pdf_base64' => base64_encode($pdf->output()),
                'filename' => "consignation_{$consignation->xnum_0}.pdf"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la génération du PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate PDF for multiple consignations within a date range.
     */
    public function generateRangePDF(Request $request)
    {
        try {
            // Handle both POST and GET requests
            $data = $request->isMethod('post') ? $request->all() : $request->query();

            $validatedData = Validator::make($data, [
                'valeur_debut' => 'required|string',
                'valeur_fin' => 'required|string',
                'code_etat' => 'required|string',
                'description' => 'required|string',
                'filter_mode' => 'nullable|string',
                'filter_client_exact' => 'nullable|string',
                'filter_site_exact' => 'nullable|string'
            ])->validate();

            // Start with the base query
            $query = Consignation::where('xvalsta_0', 2);

            // Apply filtering based on mode
            if (isset($validatedData['filter_mode']) && $validatedData['filter_mode'] === 'specific') {
                // Specific client/site filtering
                if (isset($validatedData['filter_client_exact'])) {
                    $query->where('xclient_0', $validatedData['filter_client_exact']);
                }
                if (isset($validatedData['filter_site_exact'])) {
                    $query->where('xsite_0', $validatedData['filter_site_exact']);
                }
            } else {
                // Default range-based filtering
                $query->where('xnum_0', '>=', $validatedData['valeur_debut'])
                      ->where('xnum_0', '<=', $validatedData['valeur_fin']);
            }

            $consignations = $query->orderBy('xnum_0')->get();

            if ($consignations->isEmpty()) {
                return response()->json([
                    'message' => 'Aucune consignation validée trouvée dans cette plage.'
                ], 404);
            }

            // Use the existing consignation template
            $pdf = PDF::loadView('pdf.consignation-multiple', [
                'consignations' => $consignations,
                'valeur_debut' => $validatedData['valeur_debut'],
                'valeur_fin' => $validatedData['valeur_fin'],
                'code_etat' => $validatedData['code_etat'],
                'description' => $validatedData['description'],
                'date_generation' => now()->format('d/m/Y H:i:s'),
                'filter_mode' => $validatedData['filter_mode'] ?? 'range',
                'filter_client' => $validatedData['filter_client_exact'] ?? null,
                'filter_site' => $validatedData['filter_site_exact'] ?? null
            ]);
            $pdf->setPaper('a4', 'portrait');

            // Generate filename based on filter mode
            $filename = "etat_consignations";
            if (isset($validatedData['filter_mode']) && $validatedData['filter_mode'] === 'specific') {
                if (isset($validatedData['filter_client_exact'])) {
                    $filename .= "_client_{$validatedData['filter_client_exact']}";
                }
                if (isset($validatedData['filter_site_exact'])) {
                    $filename .= "_site_{$validatedData['filter_site_exact']}";
                }
            } else {
                $filename .= "_{$validatedData['valeur_debut']}_{$validatedData['valeur_fin']}";
            }
            $filename .= ".pdf";

            return $pdf->stream($filename);

        } catch (\Exception $e) {
            Log::error('Error generating consignations range PDF: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la génération du PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Preview PDF for a consignation in the browser.
     */
  public function previewPDF(string $xnum_0)
{
    try {
        $consignation = Consignation::with(['facility'])
            ->where('xnum_0', $xnum_0)
            ->first();

        if (!$consignation) {
            return response('Consignation non trouvée', 404);
        }

        $client = $consignation->xclient_0;
        $site = $consignation->xsite_0;
        $targetCreatedAt = $consignation->created_at;

        // Charger TOUTES les opérations validées pour ce client/site
        $operations = collect()
            ->merge(Xcaution::where('xclient_0', $client)
                ->where('xsite_0', $site)
                ->where('xvalsta_0', 2)
                ->get()
                ->map(fn($op) => (object)[
                    'type' => 'Caution',
                    'created_at' => $op->created_at,
                    'montant' => $op->montant,
                ]))
            ->merge(Consignation::where('xclient_0', $client)
                ->where('xsite_0', $site)
                ->where('xvalsta_0', 2)
                ->get()
                ->map(fn($op) => (object)[
                    'type' => 'Consignation',
                    'created_at' => $op->created_at,
                    'palette_a_consigner' => $op->palette_a_consigner,
                    'is_current' => $op->xnum_0 === $xnum_0,
                ]))
            ->merge(Deconsignation::where('xclient_0', $client)
                ->where('xsite_0', $site)
                ->where('xvalsta_0', 2)
                ->get()
                ->map(fn($op) => (object)[
                    'type' => 'Déconsignation',
                    'created_at' => $op->created_at,
                    'palette_deconsignees' => $op->palette_deconsignees,
                ]))
            ->merge(Restitution::where('xclient_0', $client)
                ->where('xsite_0', $site)
                ->where('xvalsta_0', 2)
                ->get()
                ->map(fn($op) => (object)[
                    'type' => 'Restitution',
                    'created_at' => $op->created_at,
                    'montant' => $op->montant,
                ]));

        // Trier toutes les opérations par created_at
        $sortedOps = $operations->sortBy('created_at')->values();

        $cumulCaution = 0;
        $cumulConsignees = 0;
        $cumulDeconsignees = 0;
        $cumulRestitution = 0;

        $cautionBefore = 0;
        $cautionAfter = 0;

        foreach ($sortedOps as $op) {
            // Enregistrer le solde juste AVANT cette consignation
            if (
                $op->type === 'Consignation' &&
                property_exists($op, 'is_current') &&
                $op->is_current
            ) {
                $cautionBefore = $cumulCaution - $cumulConsignees + $cumulDeconsignees - $cumulRestitution;
            }

            // Appliquer la logique cumulée
            if ($op->type === 'Caution') {
                $cumulCaution += $op->montant ?? 0;
            } elseif ($op->type === 'Consignation') {
                $cumulConsignees += ($op->palette_a_consigner ?? 0) * 100;
            } elseif ($op->type === 'Déconsignation') {
                $cumulDeconsignees += ($op->palette_deconsignees ?? 0) * 100;
            } elseif ($op->type === 'Restitution') {
                $cumulRestitution += $op->montant ?? 0;
            }

            // Enregistrer le solde juste APRÈS cette consignation
            if (
                $op->type === 'Consignation' &&
                property_exists($op, 'is_current') &&
                $op->is_current
            ) {
                $cautionAfter = $cumulCaution - $cumulConsignees + $cumulDeconsignees - $cumulRestitution;
            }
        }

        // Palettes
        // Total des palettes consignées avant la consignation actuelle
$beforePalettesConsignees = Consignation::where('xclient_0', $client)
    ->where('xsite_0', $site)
    ->where('xvalsta_0', 2)
    ->where('created_at', '<', $targetCreatedAt)
    ->sum('palette_a_consigner');

// Total des palettes déconsignées avant la consignation actuelle
$beforePalettesDeconsignees = Deconsignation::where('xclient_0', $client)
    ->where('xsite_0', $site)
    ->where('xvalsta_0', 2)
    ->where('created_at', '<', $targetCreatedAt)
    ->sum('palette_deconsignees');

// Solde avant cette consignation
$beforePalettes = $beforePalettesConsignees - $beforePalettesDeconsignees;

// Ajouter les palettes de la consignation actuelle si disponibles
$currentPalettes = isset($consignation) && $consignation->palette_a_consigner !== null
    ? (int) $consignation->palette_a_consigner
    : 0;

// Solde après cette consignation
$afterPalettes = $beforePalettes + $currentPalettes;


        // Générer PDF
        $pdf = PDF::loadView('pdf.consignation', [
            'consignation' => $consignation,
            'caution_before' => round($cautionBefore / 100, 2),
            'caution_after' => round($cautionAfter / 100, 2),
            'before_palettes' => $beforePalettes,
            'after_palettes' => $afterPalettes
        ]);

        return $pdf->stream("consignation_{$consignation->xnum_0}.pdf");
    } catch (\Exception $e) {
        return response('Erreur lors de la génération du PDF: ' . $e->getMessage(), 500);
    }
}



    /**
     * Get delivery documents for dropdown based on query.
     */
    public function getDeliveryDocuments(Request $request): JsonResponse
{
    try {
        $client = $request->query('client');
        $site   = $request->query('site');

        if (!$client || !$site) {
            return response()->json([
                'success' => false,
                'message' => 'client et site sont obligatoires.',
                'data' => [],
            ], 422);
        }

        if (!Schema::connection('sqlsrv_erp')->hasTable('SDELIVERY')) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $rows = DB::connection('sqlsrv_erp')->table('SDELIVERY')
            ->select('SDHNUM_0','BPINAM_0','SOHTYP_0','BPCORD_0','STOFCY_0')
            ->where('CFMFLG_0', 1)
            ->whereIn('SOHTYP_0', ['PV','AG'])
            ->where('BPCORD_0', $client)
            ->where('STOFCY_0', $site)
            ->orderBy('SDHNUM_0','desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $rows,
            'count'   => $rows->count(),
        ]);
    } catch (\Throwable $e) {
        return response()->json(['success'=>false,'message'=>$e->getMessage()],500);
    }
}



    /**
     * Get active trucks for dropdown list.
     */
    public function getActiveTrucks(): JsonResponse
    {
        try {
            $tableExists = \Illuminate\Support\Facades\Schema::hasTable('xcamion');

            if (!$tableExists) {
                return response()->json([
                    'success' => true,
                    'message' => 'Table xcamion not found, using mock data',
                    'data' => [
                        ['xmat_0' => 'C-001'],
                        ['xmat_0' => 'C-002'],
                        ['xmat_0' => 'C-003']
                    ]
                ]);
            }

            $trucks = DB::table('xcamion')
                ->select('xmat_0')
                ->where('enaflg_0', 2)
                ->get();

            if ($trucks->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No active trucks found, using sample data',
                    'data' => [
                        ['xmat_0' => 'C-001'],
                        ['xmat_0' => 'C-002'],
                        ['xmat_0' => 'C-003']
                    ]
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $trucks
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des matricules de camions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the current solde for a client and site from csolde table.
     */
    public function getSolde(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'codeClient' => 'required|string',
                'site' => 'required|string',
                'recalculate' => 'nullable|boolean'
            ]);

            if ($request->get('recalculate', false)) {
                try {
                    $solde = Csolde::recalculateBalance($request->codeClient, $request->site);
                    Log::info("Balance recalculated on request for client: {$request->codeClient}, site: {$request->site}, result: {$solde}");
                } catch (\Exception $e) {
                    Log::error("Error during forced recalculation: " . $e->getMessage());
                    $solde = DB::table('csolde')
                                ->where('codeClient', $request->codeClient)
                                ->where('site', $request->site)
                                ->value('solde') ?? 0;
                }
            } else {
                $solde = DB::table('csolde')
                            ->where('codeClient', $request->codeClient)
                            ->where('site', $request->site)
                            ->value('solde');

                if ($solde === null) {
                    try {
                        $solde = Csolde::recalculateBalance($request->codeClient, $request->site);
                        Log::info("Balance recalculated (no existing record) for client: {$request->codeClient}, site: {$request->site}, result: {$solde}");
                    } catch (\Exception $e) {
                        Log::error("Error during automatic recalculation: " . $e->getMessage());
                        $solde = 0;
                    }
                }
            }

            $solde = $solde ?? 0;

            Log::info("Balance lookup for client: {$request->codeClient}, site: {$request->site}, result: {$solde}");

            return response()->json([
                'success' => true,
                'data' => [
                    'codeClient' => $request->codeClient,
                    'site' => $request->site,
                    'solde' => (float) $solde
                ],
                'message' => 'Solde récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error("Error in getSolde: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Erreur lors de la récupération du solde: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create test validated cautions for testing solde functionality.
     */
    public function createTestCautions(): JsonResponse
    {
        try {
            $testCautions = [];

            $caution1 = \App\Models\Caution::create([
                'xnum_0' => 'TEST-SOLDE-001',
                'xsite_0' => 'MENARA',
                'xclient_0' => 'CLIENT001',
                'xraison_0' => 'Test Client for Solde',
                'xdate_0' => now()->format('Y-m-d'),
                'xheure_0' => now()->format('H:i'),
                'montant' => 1500.00,
                'xvalsta_0' => 2
            ]);
            $testCautions[] = $caution1;

            $caution2 = \App\Models\Caution::create([
                'xnum_0' => 'TEST-SOLDE-002',
                'xsite_0' => 'CASA',
                'xclient_0' => 'CLIENT002',
                'xraison_0' => 'Test Client 2 for Solde',
                'xdate_0' => now()->format('Y-m-d'),
                'xheure_0' => now()->format('H:i'),
                'montant' => 2500.00,
                'xvalsta_0' => 2
            ]);
            $testCautions[] = $caution2;

            return response()->json([
                'success' => true,
                'message' => 'Test cautions created successfully',
                'data' => collect($testCautions)->map(function($caution) {
                    return [
                        'id' => $caution->xnum_0,
                        'client' => $caution->xclient_0,
                        'site' => $caution->xsite_0,
                        'montant' => $caution->montant,
                        'nombre_palette' => $caution->nombre_palette,
                        'expected_solde' => $caution->nombre_palette * 100
                    ];
                })
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating test cautions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test the comprehensive solde recalculation system.
     */
    public function testSoldeRecalculation(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'codeClient' => 'required|string',
                'site' => 'required|string'
            ]);

            $codeClient = $request->codeClient;
            $site = $request->site;

            $currentBalance = DB::table('csolde')
                                ->where('codeClient', $codeClient)
                                ->where('site', $site)
                                ->value('solde') ?? 0;

            $newBalance = Csolde::recalculateBalance($codeClient, $site);

            $cautionTotal = \App\Models\Caution::where('xclient_0', $codeClient)
                                              ->where('xsite_0', $site)
                                              ->where('xvalsta_0', 2)
                                              ->sum('montant') ?? 0;

            $consignationTotal = \App\Models\Consignation::where('xclient_0', $codeClient)
                                                        ->where('xsite_0', $site)
                                                        ->where('xvalsta_0', 2)
                                                        ->sum(DB::raw('palette_a_consigner * 100')) ?? 0;

            $deconsignationTotal = \App\Models\Deconsignation::where('xclient_0', $codeClient)
                                                            ->where('xsite_0', $site)
                                                            ->where('xvalsta_0', 2)
                                                            ->sum(DB::raw('palette_deconsignees * 100')) ?? 0;

            $restitutionTotal = \App\Models\Restitution::where('xclient_0', $codeClient)
                                                      ->where('xsite_0', $site)
                                                      ->where('xvalsta_0', 2)
                                                      ->sum('montant') ?? 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'client' => $codeClient,
                    'site' => $site,
                    'current_balance' => (float) $currentBalance,
                    'new_balance' => (float) $newBalance,
                    'changed' => $currentBalance != $newBalance,
                    'breakdown' => [
                        'caution_total' => (float) $cautionTotal,
                        'consignation_total' => (float) $consignationTotal,
                        'deconsignation_total' => (float) $deconsignationTotal,
                        'restitution_total' => (float) $restitutionTotal,
                        'formula' => 'SOLDE = caution_total - consignation_total - deconsignation_total + restitution_total'
                    ]
                ],
                'message' => 'Recalculation completed successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error during recalculation test: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate consignation before saving - check if balance is sufficient.
     */
    public function validateConsignation(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'xclient_0' => 'required|string',
                'xsite_0' => 'required|string',
                'palette_a_consigner' => 'required|integer|min:1'
            ]);

            $client = $request->xclient_0;
            $site = $request->xsite_0;
            $palettes = $request->palette_a_consigner;

            $currentBalance = DB::table('csolde')
                                ->where('codeClient', $client)
                                ->where('site', $site)
                                ->value('solde') ?? 0;

            $requiredAmount = $palettes * 100;
            $isValid = $requiredAmount <= $currentBalance;
            $remainingBalance = $currentBalance - $requiredAmount;

            Log::info("Consignation validation: Client=$client, Site=$site, Palettes=$palettes, Current=$currentBalance, Required=$requiredAmount, Valid=" . ($isValid ? 'YES' : 'NO'));

            return response()->json([
                'success' => true,
                'data' => [
                    'is_valid' => $isValid,
                    'current_balance' => (float) $currentBalance,
                    'required_amount' => (float) $requiredAmount,
                    'remaining_balance' => (float) $remainingBalance,
                    'client' => $client,
                    'site' => $site,
                    'palettes' => $palettes
                ],
                'message' => $isValid ? 'Validation réussie' : 'Solde insuffisant'
            ]);

        } catch (\Exception $e) {
            Log::error("Error in validateConsignation: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Erreur lors de la validation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Fix all balances by recalculating them comprehensively.
     */
    public function fixAllBalances(): JsonResponse
    {
        try {
            $balanceRecords = DB::table('csolde')
                               ->select('codeClient', 'site')
                               ->get();

            $results = [];
            $totalFixed = 0;

            foreach ($balanceRecords as $record) {
                try {
                    $oldBalance = DB::table('csolde')
                                   ->where('codeClient', $record->codeClient)
                                   ->where('site', $record->site)
                                   ->value('solde');

                    $newBalance = Csolde::recalculateBalance($record->codeClient, $record->site);

                    $results[] = [
                        'client' => $record->codeClient,
                        'site' => $record->site,
                        'old_balance' => (float) $oldBalance,
                        'new_balance' => (float) $newBalance,
                        'fixed' => $oldBalance != $newBalance
                    ];

                    if ($oldBalance != $newBalance) {
                        $totalFixed++;
                    }

                } catch (\Exception $e) {
                    $results[] = [
                        'client' => $record->codeClient,
                        'site' => $record->site,
                        'error' => $e->getMessage()
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Fixed {$totalFixed} balance records",
                'data' => $results,
                'summary' => [
                    'total_records' => count($balanceRecords),
                    'fixed_records' => $totalFixed,
                    'unchanged_records' => count($balanceRecords) - $totalFixed
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fixing balances: ' . $e->getMessage()
            ], 500);
        }
    }
}
