<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Camion extends Model
{
    use HasFactory;

    protected $connection = 'sqlsrv';
     protected $table = 'xcamion';

    protected $fillable = [
        'xmat_0',        // Matricule du camion
        'description',   // Description du camion
        'enaflg_0',      // Flag for enabled status (2 = enabled)
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'enaflg_0' => 'integer'
    ];
}
