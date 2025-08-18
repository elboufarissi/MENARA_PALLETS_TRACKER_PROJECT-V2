<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BpCustomer;
use App\Models\Xcaution;
use App\Models\Deconsignation;
use App\Models\Consignation;
use App\Models\Restitution;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class SituationClientController extends Controller
{
    public function getSituation(Request $request)
    {
        $client = $request->query('client');
        $site = $request->query('site');

        if (!$client || !$site) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètres manquants: client ou site'
            ], 400);
        }

        try {
            // Récupérer les cautions
            $cautions = Xcaution::where('xclient_0', $client)
                                ->where('xsite_0', $site)
                                ->where('xvalsta_0', 2)
                                ->get();

           $cautionPalettes = $cautions->sum(function ($item) {
                return ($item->montant ?? 0) / 100;
            });

            $cautionDh = $cautions->sum('montant') ?? 0;

            $palettesConsignees = Consignation::where('xclient_0', $client)
                                              ->where('xsite_0', $site)
                                              ->where('xvalsta_0', 2)
                                              ->sum('palette_a_consigner') ?? 0;

            $palettesDeconsignees = Deconsignation::where('xclient_0', $client)
                                                  ->where('xsite_0', $site)
                                                  ->where('xvalsta_0', 2)
                                                  ->sum('palette_deconsignees') ?? 0;

            $sumrestitutions = Restitution::where('xclient_0', $client)
                                                  ->where('xsite_0', $site)
                                                  ->where('xvalsta_0', 2)
                                                  ->sum('montant') ?? 0;
            
            // Convert restitutions to palette units (divide by 100) for consistent calculation
            $restitutionPalettes = $sumrestitutions / 100;
            
            // Calculate balance in palette units - FIXED CALCULATION
            $soldePalettes = $cautionPalettes - $palettesConsignees + $palettesDeconsignees - $restitutionPalettes;
            $soldeDh = $soldePalettes * 100;

            $clientObj = BpCustomer::where('BPCNUM_0', $client)->first();
            $raisonSociale = $clientObj ? $clientObj->bpcnam_0 : '';

            // 🔽 Charger toutes les opérations
            $operations = new Collection();

            // Cautions
            foreach ($cautions as $item) {
                $operations->push([
                    'type' => 'Caution',
                    'code' => $item->xnum_0,
                    'client' => $item->xclient_0,
                    'site' => $item->xsite_0,
                    'date' => $item->xdate_0,
                    'montant' => $item->montant,
                    'statut' => $item->xvalsta_0,
                    'created_at' => $item->created_at
                ]);
            }

            // Consignations
            $consignations = Consignation::where('xclient_0', $client)
                                         ->where('xsite_0', $site)
                                         ->get();

            foreach ($consignations as $item) {
                $operations->push([
                    'type' => 'Consignation',
                    'code' => $item->xnum_0,
                    'client' => $item->xclient_0,
                    'site' => $item->xsite_0,
                    'date' => $item->xdate_0,
                    'palette_ramenee' => $item->palette_ramene,
                    'palette_a_consigner' => $item->palette_a_consigner,
                    'palette_consignees' => $item->palette_consignees,
                    'statut' => $item->xvalsta_0,
                    'created_at' => $item->created_at
                ]);
            }

            // Déconsignations
            $deconsignations = Deconsignation::where('xclient_0', $client)
                                             ->where('xsite_0', $site)
                                             ->get();

            foreach ($deconsignations as $item) {
                $operations->push([
                    'type' => 'Déconsignation',
                    'client' => $item->xclient_0,
                    'code' => $item->xnum_0,
                    'site' => $item->xsite_0,
                    'date' => $item->xdate_0,
                    'palette_ramenee' => $item->palette_ramene,
                    'palette_deconsignees' => $item->palette_deconsignees,
                    'statut' => $item->xvalsta_0,
                    'created_at' => $item->created_at
                ]);
            }

            // Restitutions
            $restitutions = Restitution::where('xclient_0', $client)
                                       ->where('xsite_0', $site)
                                       ->get();

            foreach ($restitutions as $item) {
                $operations->push([
                    'type' => 'Restitution',
                    'code' => $item->xnum_0,
                    'client' => $item->xclient_0,
                    'site' => $item->xsite_0,
                    'date' => $item->xdate_0,
                    'montant' => $item->montant,
                    'statut' => $item->xvalsta_0,
                    'created_at' => $item->created_at
                ]);
            }


            $operations = $operations->sortByDesc('created_at')->values();

            return response()->json([
                'success' => true,
                'client' => $client,
                'site' => $site,
                'raison' => $raisonSociale,
                'cautionPalettes' => (float) $cautionPalettes,
                'palettesConsignees' => (int) $palettesConsignees,
                'cautionDh' => (int) $cautionDh,
                'palettesDeconsignees' => (int) $palettesDeconsignees,
                'soldePalettes' => (float) $soldePalettes,
                'soldeDh' => (float) $soldeDh,
                'operations' => $operations,
                'sumrestitutions' => (int) $sumrestitutions
            ]);
        } catch (\Exception $e) {
            Log::error('SituationClient Error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            Log::error('Client: ' . $client . ', Site: ' . $site);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la situation client.',
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => basename($e->getFile())
            ], 500);
        }
    }
}
