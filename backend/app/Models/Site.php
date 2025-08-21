<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Site extends Model
{
    use HasFactory;

    protected $fillable = [
        'site_code',
        'site_name',
        'address',
        'active'
    ];

    /**
     * Get the xcautions for this site.
     */
    public function xcautions()
    {
        return $this->hasMany(Xcaution::class, 'xsite_0', 'site_code');
    }

    /**
     * Get the consignations for this site.
     */
    public function consignations()
    {
        return $this->hasMany(Consignation::class, 'xsite_0', 'site_code');
    }

    /**
     * Get the deconsignations for this site.
     */
    public function deconsignations()
    {
        return $this->hasMany(Deconsignation::class, 'xsite_0', 'site_code');
    }

    /**
     * Scope to get only active sites.
     */
    public function scopeActive($query)
    {
        return $query->where('active', 1);
    }
}
