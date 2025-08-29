<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BpCustomer extends Model
{
    protected $connection = 'sqlsrv_erp';
    protected $table = 'BPCUSTOMER';  // Fixed: table name is bpcustomer, not bp_customer
    protected $primaryKey = 'BPCNUM_0';
    public $incrementing = false;     // Primary key is not auto-incrementing
    protected $keyType = 'string';    // Primary key is a string, not integer

    public $timestamps = true;

    protected $fillable = ['BPCNAM_0', 'TSCCOD_0', 'OSTCTL_0'];

    public function cautions()
    {
        return $this->hasMany(Caution::class, 'xclient_0', 'BPCNUM_0');
    }
}

