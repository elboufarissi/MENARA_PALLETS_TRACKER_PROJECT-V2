<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facility extends Model
{

    protected $connection = 'sqlsrv_erp';
    protected $table = 'FACILITY';
    protected $primaryKey = 'FCY_0';

    public $timestamps = true;

    // protected $fillable = ['fcynam_0', 'cpy_0'];
   protected $fillable = [

        'FCYNAM_0'
    ];

    public function cautions()
    {
        return $this->hasMany(Xcaution::class, 'xsite_0', 'FCY_0');
    }
}
