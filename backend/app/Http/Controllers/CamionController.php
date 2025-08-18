<?php

namespace App\Http\Controllers;

use App\Models\Camion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CamionController extends Controller
{
    /**
     * Get all active vehicles
     */
    public function index()
    {
        $camions = Camion::where('enaflg_0', 2)->get();
        
        return response()->json([
            'success' => true,
            'data' => $camions
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'xmat_0' => 'required|string|max:255|unique:camions',
            'description' => 'nullable|string|max:255',
            'enaflg_0' => 'required|integer|in:1,2',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $camion = Camion::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Camion créé avec succès',
            'data' => $camion
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $camion = Camion::findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $camion
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $camion = Camion::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'xmat_0' => 'required|string|max:255|unique:camions,xmat_0,' . $id,
            'description' => 'nullable|string|max:255',
            'enaflg_0' => 'required|integer|in:1,2',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $camion->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Camion mis à jour avec succès',
            'data' => $camion
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $camion = Camion::findOrFail($id);
        $camion->delete();

        return response()->json([
            'success' => true,
            'message' => 'Camion supprimé avec succès'
        ]);
    }
}
