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
        Schema::create('xcautions', function (Blueprint $table) {
            $table->string('xnum_0', 20)->primary(); // Primary Key: CT+SITE+DATE+COUNTER
            $table->string('xsite_0')->nullable(); // Facility ID as integer
            $table->string('xclient_0')->nullable(); // Client ID as integer
            $table->string('xraison_0')->nullable(); // Reason for caution
            $table->string('xcin_0', 10); // CIN as string
            $table->date('xdate_0')->nullable(); // Date as date
            $table->time('xheure_0')->nullable(); // Time as time
            $table->integer('xvalsta_0')->default(1); // 1 = Non validé, 2 = Validé
            $table->decimal('montant', 15, 2); // Amount as integer
            $table->timestamp('credattim')->nullable(); 
            $table->timestamp('upddattim')->nullable();
            $table->char('auuid', 36)->nullable();
            $table->string('creusr')->nullable();
            $table->string('updusr')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('xcautions');
    }
};
