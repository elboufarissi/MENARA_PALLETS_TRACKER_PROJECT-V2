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
    public function up()
    {
        Schema::table('xcautions', function (Blueprint $table) {
            $table->integer('xvalsta_0')->default(1)->change();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('xcautions', function (Blueprint $table) {
            $table->boolean('xvalsta_0')->default(true)->change();
        });
    }
};
