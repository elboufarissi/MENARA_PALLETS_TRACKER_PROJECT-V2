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
        Schema::create('bpcustomer', function (Blueprint $table) {
            $table->string('BPCNUM_0');
            $table->string('BPCNAM_0');
            $table->string('TSCCOD_0');
            $table->integer('OSTCTL_0');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bpcustomer');
    }
};
