<?php

namespace App\Http\Controllers;

use App\Models\BpCustomer;
use Illuminate\Http\Request;

class ClientController extends Controller
{    public function index()
    {
        try {
            // Query: SELECT BPCNUM_0,BPCNAM_0 FROM X3V12.MENARA.BPCUSTOMER XBP
            // WHERE TSCCOD_0='P' AND OSTCTL_0<>3 (3=Bloqué)
            $customers = BpCustomer::where('TSCCOD_0', 'P')
                                  ->where('OSTCTL_0', '<>', 3)  // Exclude blocked customers (3=Bloqué)
                                  ->select('BPCNUM_0', 'BPCNAM_0')
                                  ->get();

            // Check if no customers found
            if ($customers->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client introuvable',  // As per your requirement
                    'data' => [],
                    'count' => 0
                ]);
            }

            // Transform to match frontend expectations
            $clients = $customers->map(function($customer) {
                return [
                    'id' => $customer->BPCNUM_0,
                    'client_code' => $customer->BPCNUM_0,
                    'client_name' => $customer->BPCNAM_0,
                    'raison_sociale' => $customer->BPCNAM_0,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $clients,
                'count' => $clients->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'message' => 'Failed to fetch clients'
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $client = BpCustomer::where('BPCNUM_0', $id)->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $client->BPCNUM_0,
                    'client_code' => $client->BPCNUM_0,
                    'client_name' => $client->BPCNAM_0,
                    'raison_sociale' => $client->BPCNAM_0,
                    'BPCNUM_0' => $client->BPCNUM_0,
                    'BPCNAM_0' => $client->BPCNAM_0
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'message' => 'Failed to fetch client'
            ], 500);
        }
    }
}
