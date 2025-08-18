<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        
        'client_code',
        'client_name',
        'raison_sociale',
        'address',
        'phone',
        'email',
        'active'
    ];

    /**
     * Get the xcautions for this client.
     */
    public function xcautions()
    {
        return $this->hasMany(Xcaution::class, 'xclient_0', 'client_code');
    }

    /**
     * Get the consignations for this client.
     */
    public function consignations()
    {
        return $this->hasMany(Consignation::class, 'xclient_0', 'client_code');
    }

    /**
     * Get the deconsignations for this client.
     */
    public function deconsignations()
    {
        return $this->hasMany(Deconsignation::class, 'xclient_0', 'client_code');
    }

    /**
     * Scope to get only active clients.
     */
    public function scopeActive($query)
    {
        return $query->where('active', 1);
    }
}
