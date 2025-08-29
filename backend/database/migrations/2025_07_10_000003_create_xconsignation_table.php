<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::create('xconsignation', function (Blueprint $table) {
            $table->string('xnum_0', 50)->primary();
            $table->string('xsite_0')->nullable();
            $table->string('xclient_0')->nullable();
            $table->string('xraison_0')->nullable();
            $table->string('xbp_0')->nullable();
            $table->string('xcamion_0')->nullable();
            $table->date('xdate_0')->nullable();
            $table->string('xheure_0', 0)->nullable();
            $table->integer('palette_ramene')->nullable();
            $table->integer('palette_a_consigner')->nullable();
            $table->integer('palette_consignees')->nullable();
            $table->integer('xvalsta_0')->default(1);
            $table->dateTime('created_at', 7)->nullable()->default(DB::raw('SYSUTCDATETIME()'));
           $table->dateTime('updated_at', 7)->nullable()->default(DB::raw('SYSUTCDATETIME()'));

        });
    }

    public function down()
    {
        Schema::dropIfExists('xconsignation');
    }
};
