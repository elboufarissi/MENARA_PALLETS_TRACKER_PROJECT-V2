<?php
namespace App\Http\Controllers;

use App\Models\Xcaution;
use App\Models\Deconsignation;
use App\Models\Consignation;
use App\Models\Restitution;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf as PDF;

class XcautionController extends Controller
{
    private static $tempPdfData = null;

  public function index()
{
    try {
        // Récupérer les cautions avec le client associé
        $cautions = Xcaution::with('customer')
            ->orderBy('created_at', 'desc')
            ->paginate(5); //Pagination 5 par page

        return response()->json($cautions, 200, [], JSON_INVALID_UTF8_SUBSTITUTE);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Erreur lors de la récupération des cautions',
            'error'   => $e->getMessage()
        ], 500);
    }
}




    public function show($xnum_0)
{
    $caution = Xcaution::where('xnum_0', $xnum_0)
                        ->with(['customer'])
                        ->first();

    if (!$caution) {
        return response()->json(['message' => 'Caution not found.'], 404);
    }

    // Forcer UTF-8 sur toutes les valeurs string du modèle et relations
    $cautionArray = array_map(function($value) {
        if (is_array($value)) {
            // Appliquer récursivement pour les relations
            return array_map(fn($v) => is_string($v) ? mb_convert_encoding($v, 'UTF-8', 'UTF-8') : $v, $value);
        }
        return is_string($value) ? mb_convert_encoding($value, 'UTF-8', 'UTF-8') : $value;
    }, $caution->toArray());

    return response()->json($cautionArray);
}

    public function store(Request $request)
    {
        // Data from frontend form:
        // xnum_0: string (Caution ID)
        // xsite_0: string (Site ID/code from text input)
        // xclient_0: string (Client ID/code from text input)
        // xraison_0: string|nullable
        // xcin_0: string
        // xvalsta_0: string ("1" or "2")
        // montant: number (string from form, will be cast)
        // xdate_0: string (currentDate from form, "dd/MM/yyyy")
        // xheure_0: string (currentTime from form, "HH:mm")

        $validator = Validator::make($request->all(), [
            'xsite_0'   => 'required|string|max:255', // Assuming these are string identifiers
            'xclient_0' => 'required|string|max:255',
            'xraison_0' => 'nullable|string|max:255',
            'xcin_0'    => [
                'required',
                'regex:/^[A-Za-z]{1,2}\d{4,8}$/'
            ],
            'xvalsta_0' => 'required|in:1,2', // Form sends "1" or "2"
            'montant'   => 'required|numeric|min:0.01',
            'xdate_0'   => 'required|string|date_format:d/m/Y', // Validates "dd/MM/yyyy"
            'xheure_0'  => 'required|string|date_format:H:i',  // Validates "HH:mm"
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validatedData = $validator->validated();

        // Prepare data for creation
        $dataToCreate = $validatedData;

        // Convert date to Y-m-d for database storage if model cast doesn't handle 'd/m/Y' directly on input.
        // The model's cast 'date:Y-m-d' is for how it's serialized FROM the DB and how Carbon instances treat it.
        // It's safer to ensure the string going into create() is in 'Y-m-d' format for date fields.
        $dataToCreate['xdate_0'] = Carbon::createFromFormat('d/m/Y', $validatedData['xdate_0'])->format('Y-m-d');

        // xheure_0 is already in "H:i" format, which is fine for MySQL TIME columns.

        // If creusr/updusr are to be set and not handled by model boot based on auth()
        // $dataToCreate['creusr'] = auth()->user()->USERID ?? 'SYSTEM'; // Example
        // $dataToCreate['updusr'] = auth()->user()->USERID ?? 'SYSTEM'; // Example

        $caution = Xcaution::create($dataToCreate);

        // Trigger comprehensive balance recalculation if caution is created as validated
        if (isset($dataToCreate['xvalsta_0']) && $dataToCreate['xvalsta_0'] == 2) {
            try {
                \App\Models\Csolde::recalculateBalance($caution->xclient_0, $caution->xsite_0);
                Log::info("Balance recalculated after validated caution creation: Client={$caution->xclient_0}, Site={$caution->xsite_0}");
            } catch (\Exception $e) {
                Log::error("Error recalculating balance after validated caution creation: " . $e->getMessage());
            }

            // Send notification when caution is created as validated
            try {
                $fromUserId = $request->user() ? $request->user()->USER_ID : null;
                NotificationService::cautionValidated($caution, $fromUserId);
                Log::info("Notification sent for caution creation (validated): {$caution->xnum_0}");
            } catch (\Exception $e) {
                Log::error("Error sending notification for caution creation: " . $e->getMessage());
                // Don't fail the creation just because of notification error
            }
        }

        // You might want to load relationships if your frontend expects them after creation
        // $caution->load(['facility', 'customer']);

        return response()->json($caution, 201); // Return the created caution (status 201)
    }

    public function generatePDF($xnum_0)
    {
        try {
            // Get the caution record with related customer data
            $caution = Xcaution::where('xnum_0', $xnum_0)->firstOrFail();

            $pdf = PDF::loadView('pdf.bon-caution', [
                'caution' => $caution
            ]);

            // Set paper size and orientation
            $pdf->setPaper('a4', 'portrait');

            // Set additional options for proper CSS loading
            $pdf->setOption('enable-local-file-access', true);
            $pdf->setOption('isRemoteEnabled', true);

            // Generate a filename based on the caution number
            $filename = 'bon_caution_' . $caution->xnum_0 . '.pdf';

            // Return the PDF for download
            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('PDF Generation Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la génération du PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

  public function previewPDF($xnum_0)
{
    try {
        // Récupérer la caution
        $caution = Xcaution::where('xnum_0', $xnum_0)->firstOrFail();

        $client = $caution->xclient_0;
        $site = $caution->xsite_0;
        $targetCreatedAt = $caution->created_at;

        // Récupérer toutes les opérations validées pour ce client/site
        $operations = collect()
            ->merge(Xcaution::where('xclient_0', $client)
                ->where('xsite_0', $site)
                ->where('xvalsta_0', 2)
                ->get()
                ->map(fn($op) => (object)[
                    'type' => 'Caution',
                    'created_at' => $op->created_at,
                    'montant' => $op->montant,
                    'is_current' => $op->xnum_0 === $xnum_0,
                ]))
            ->merge(Consignation::where('xclient_0', $client)
                ->where('xsite_0', $site)
                ->where('xvalsta_0', 2)
                ->get()
                ->map(fn($op) => (object)[
                    'type' => 'Consignation',
                    'created_at' => $op->created_at,
                    'palette_a_consigner' => $op->palette_a_consigner,
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

        // Trier toutes les opérations
        $sortedOps = $operations->sortBy('created_at')->values();

        // Initialisation
        $cumulCaution = 0;
        $cumulConsignees = 0;
        $cumulDeconsignees = 0;
        $cumulRestitution = 0;

        $cautionBefore = 0;
        $cautionAfter = 0;

        foreach ($sortedOps as $op) {
            $isCurrent = $op->type === 'Caution' && property_exists($op, 'is_current') && $op->is_current;

            if ($isCurrent) {
                $cautionBefore = $cumulCaution - $cumulConsignees + $cumulDeconsignees - $cumulRestitution;
                continue; // ne pas inclure la caution courante dans les cumuls
            }

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

        // Ajouter la caution actuelle si validée
        if ($caution->xvalsta_0 == 2) {
            $cautionAfter = $cautionBefore + ($caution->montant ?? 0);
        } else {
            $cautionAfter = $cautionBefore;
        }

        // Charger la vue
        $pdf = PDF::loadView('pdf.bon-caution', [
            'caution' => $caution,
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

    public function savePdfData(Request $request)
    {
        // Log received data
        Log::info('Received form data:', $request->all());

        // Store form data in static variable
        self::$tempPdfData = $request->all();

        // Log stored data
        Log::info('Stored in tempPdfData:', self::$tempPdfData);

        return response()->json(['message' => 'Data saved successfully']);
    }

    public function testPDF(Request $request)
    {
        try {
            // Create a caution object from the POST data
            $caution = new \stdClass();
            $caution->xdate_0 = $request->input('xdate_0', now()->format('d/m/Y'));
            $caution->xheure_0 = $request->input('xheure_0', now()->format('H:i'));
            $caution->xclient_0 = $request->input('xclient_0', '');
            $caution->xraison_0 = $request->input('xraison_0', '');
            $caution->xnum_0 = $this->generateCautionNumber();
            $caution->xcin_0 = $request->input('xcin_0', '');
            $caution->xsite_0 = $request->input('xsite_0', '');
            $caution->xvalsta_0 = $request->input('xvalsta_0', '2');
            $caution->montant = $request->input('montant', 0);

            $pdf = PDF::loadView('pdf.bon-caution', ['caution' => $caution]);
            $pdf->setPaper('a4', 'portrait');

            // Set additional options for proper CSS loading
            $pdf->setOption('enable-local-file-access', true);
            $pdf->setOption('isRemoteEnabled', true);

            // Return the PDF as a response with proper headers
            return response($pdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="Bon-Caution.pdf"'
            ]);

        } catch (\Exception $e) {
            Log::error('PDF Generation Error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'PDF Generation failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($xnum_0)
    {
        $caution = Xcaution::where('xnum_0', $xnum_0)->first();
        if (!$caution) {
            return response()->json(['message' => 'Caution non trouvée.'], 404);
        }
        // Only allow delete if not validated
        if ($caution->xvalsta_0 == 2) {
            return response()->json(['message' => 'Suppression interdite : caution validée.'], 403);
        }
        $caution->delete();
        return response()->json(['message' => 'Caution supprimée avec succès.']);
    }

    public function update(Request $request, $xnum_0)
    {
        $caution = Xcaution::find($xnum_0);
        if (!$caution) {
            return response()->json(['message' => 'Caution not found.'], 404);
        }

        // Check if this is a validation request (updating xvalsta_0 to 2)
        $isValidationRequest = $request->has('xvalsta_0') && $request->xvalsta_0 == 2;

        if ($isValidationRequest) {
            // For validation requests, validate all required fields
            $validator = Validator::make($request->all(), [
                'xcin_0' => [
                    'required',
                    'regex:/^[A-Za-z]{1,2}\d{4,8}$/'
                ],
                'montant' => 'required|numeric|min:0',
                'xvalsta_0' => 'required|in:1,2'
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // Update all fields including validation status
            $caution->xcin_0 = $request->xcin_0;
            $caution->montant = $request->montant;
            $caution->xvalsta_0 = $request->xvalsta_0;
            $caution->save();

            // Trigger comprehensive balance recalculation when caution is validated
            if ($request->xvalsta_0 == 2) {
                try {
                    \App\Models\Csolde::recalculateBalance($caution->xclient_0, $caution->xsite_0);
                    Log::info("Balance recalculated after caution validation: Client={$caution->xclient_0}, Site={$caution->xsite_0}");
                } catch (\Exception $e) {
                    Log::error("Error recalculating balance after caution validation: " . $e->getMessage());
                    // Don't fail the validation just because of balance calculation error
                }

                // Send notification when caution is validated
                try {
                    $fromUserId = $request->user() ? $request->user()->USER_ID : null;
                    NotificationService::cautionValidated($caution, $fromUserId);
                    Log::info("Notification sent for caution validation: {$caution->xnum_0}");
                } catch (\Exception $e) {
                    Log::error("Error sending notification for caution validation: " . $e->getMessage());
                    // Don't fail the validation just because of notification error
                }
            }

            return response()->json(['message' => 'Caution validée avec succès.']);
        } else {
            // For regular edits, only allow update if not validée
            if ($caution->xvalsta_0 == 2) {
                return response()->json(['message' => 'Modification interdite : caution validée.'], 403);
            }

            // Validate only the editable fields (CIN and Montant)
            $validator = Validator::make($request->all(), [
                'xcin_0' => [
                    'required',
                    'regex:/^[A-Za-z]{1,2}\d{4,8}$/'
                ],
                'montant' => 'required|numeric|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // Only update the allowed fields
            $caution->xcin_0 = $request->xcin_0;
            $caution->montant = $request->montant;
            $caution->save();

            return response()->json(['message' => 'Caution modifiée avec succès.']);
        }
    }

    /**
     * Recalculate nombre_palette for all existing cautions
     * This is a one-time operation to populate the new column
     */
    public function recalculateNombrePalette()
    {
        try {
            $updated = Xcaution::whereNotNull('montant')
                              ->where(function($query) {
                                  $query->whereNull('nombre_palette')
                                        ->orWhere('nombre_palette', 0);
                              })
                              ->get()
                              ->each(function($caution) {
                                  $caution->nombre_palette = intval($caution->montant / 100);
                                  $caution->save();
                              });

            return response()->json([
                'success' => true,
                'message' => 'Nombre_palette recalculé avec succès',
                'updated_count' => $updated->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Error recalculating nombre_palette: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du recalcul: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get cautions with their calculated nombre_palette for consignation usage
     */
    public function getCautionsForConsignation()
    {
        // Get all validated cautions (xvalsta_0 = 2) with nombre_palette data
        $cautions = Xcaution::where('xvalsta_0', 2)
                           ->select('xnum_0', 'xclient_0', 'xraison_0', 'montant', 'nombre_palette', 'xdate_0')
                           ->orderBy('xdate_0', 'desc')
                           ->get();

        return response()->json([
            'success' => true,
            'data' => $cautions
        ]);
    }

    /**
     * Generate PDF report for cautions within a specified XNUM_0 range
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
            $query = Xcaution::where('xvalsta_0', 2);

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

            $cautions = $query->orderBy('xnum_0')->get();

            if ($cautions->isEmpty()) {
                return response()->json([
                    'message' => 'Aucune caution validée trouvée dans cette plage.'
                ], 404);
            }

            // Use the bon-caution-multiple template for état reports (previous design)
            $pdf = PDF::loadView('pdf.bon-caution-multiple', [
                'cautions' => $cautions,
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
            $filename = "etat_cautions";
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
            Log::error('Error generating cautions range PDF: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la génération du PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Fetch the CIN (xcin_0) for a given client code (xclient_0)
     * Returns the most recent validated caution for that client.
     */
    public function getCinByClient($clientCode)
    {
        $caution = Xcaution::where('xclient_0', $clientCode)
            ->where('xvalsta_0', 2) // Only get validated cautions
            ->orderByDesc('created_at')
            ->first();
        if (!$caution) {
            return response()->json(['message' => 'Aucune caution validée trouvée pour ce client.'], 404);
        }
        return response()->json(['xcin_0' => $caution->xcin_0]);
    }

    private function generateCautionNumber()
    {
        $date = now();
        $year = $date->format('y');
        $month = $date->format('m');
        $sequence = Xcaution::whereYear('created_at', $date->year)
                          ->whereMonth('created_at', $date->month)
                          ->count() + 1;
        return sprintf("CT%s%s%04d-0001", $year, $month, $sequence);
    }
}
