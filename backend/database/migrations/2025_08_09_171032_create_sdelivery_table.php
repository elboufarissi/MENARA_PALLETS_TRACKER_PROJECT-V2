<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
{
    Schema::connection('sqlsrv')->create('SDELIVERY', function (Blueprint $table) {
        $table->string('SOHTYP_0', 50);
        $table->string('SDHNUM_0', 50);
        $table->integer('CFMFLG_0');
        $table->string('BPINAM_0', 255)->nullable();
        $table->string('BPCORD_0', 50)->nullable();
        $table->string('STOFCY_0', 10)->nullable();
    });
}

public function down(): void
{
    Schema::connection('sqlsrv')->dropIfExists('SDELIVERY');
}


};
