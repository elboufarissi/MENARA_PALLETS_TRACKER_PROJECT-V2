<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $user = User::where('USERNAME', $request->username)->first();
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Invalid credentials'], 401);
        }
        $token = base64_encode(Str::random(60));
        $user->api_token = $token;
        $user->save();
        return response()->json(['success' => true, 'token' => $token, 'user' => $user]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->api_token = null;
            $user->save();
        }
        return response()->json(['success' => true, 'message' => 'Logout successful']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json(['user' => $user]);
    }
} 