<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Caution; 
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf as PDF;

class CautionController extends Controller
{    public function generatePDF($id)
    {
        
        try {
            $caution = Caution::find($id);

            if (!$caution) {
                return response()->json(['message' => 'Caution introuvable'], 404);
            }
            
            // Ensure time format is correct - if it's empty or 00:00:00, use current time
            if (empty($caution->xheure_0) || $caution->xheure_0 === '00:00:00') {
                $caution->xheure_0 = now()->format('H:i:s');
            }

            $pdf = PDF::loadView('pdf.bon-caution', compact('caution'));
            return $pdf->stream("bon_caution_{$id}.pdf");
        } catch (\Exception $e) {
            Log::error("Error generating PDF for caution ID {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Erreur interne du serveur.'], 500);
        }
    }
}
