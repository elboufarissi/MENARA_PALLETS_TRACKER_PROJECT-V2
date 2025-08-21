<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('xrcaution', function (Blueprint $table) {
            $table->id();
            $table->string('xnum_0')->unique();
            $table->string('xsite_0');
            $table->string('xclient_0');
            $table->string('xraison_0')->nullable();
            $table->string('xcin_0');
            $table->date('xdate_0');
            $table->time('xheure_0');
            $table->integer('xvalsta_0')->default(1);
            $table->decimal('montant', 10, 2);
            $table->string('caution_ref')->nullable();
            $table->text('remarques')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('xrcaution');
    }
}; 