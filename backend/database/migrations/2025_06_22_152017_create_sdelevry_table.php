<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sdelevry', function (Blueprint $table) {
            $table->string('SOHTYP_0');
            $table->string('SDHNUM_0');
            $table->integer('CFMFLG_0');
            $table->string('BPINAM_0'); // Nom du client
            $table->string('BPCORD_0'); // Code client
            $table->string('STOFCY_0');// Champs venant de facility
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sdelevry');
    }
};
