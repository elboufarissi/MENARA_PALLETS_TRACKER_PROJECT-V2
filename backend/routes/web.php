<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\XcautionController;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Group routes that need CSRF protection
Route::middleware(['web'])->group(function () {
    Route::post('/Bon-Caution.pdf', [XcautionController::class, 'testPDF'])->name('xcaution.test-pdf-web');
});

