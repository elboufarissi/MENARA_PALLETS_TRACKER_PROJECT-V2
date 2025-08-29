<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::create('xcautions', function (Blueprint $table) {
            $table->string('xnum_0', 20)->primary(); // Primary Key: CT+SITE+DATE+COUNTER
            $table->string('xsite_0')->nullable();   // Facility ID
            $table->string('xclient_0')->nullable(); // Client ID
            $table->string('xraison_0')->nullable(); // Reason for caution
            $table->string('xcin_0', 10);            // CIN as string

            // ✅ Use proper SQL Server-compatible types
            $table->date('xdate_0')->nullable();       // Date
            $table->string('xheure_0')->nullable();      // Time (without precision)

            $table->integer('xvalsta_0')->default(1);  // 1 = Non validé, 2 = Validé
            $table->decimal('montant', 15, 2);         // Amount

            // ✅ Use datetime2 instead of timestamp for SQL Server
            $table->dateTime('credattim')->nullable();
            $table->dateTime('upddattim')->nullable();

            $table->char('auuid', 36)->nullable();
            $table->string('creusr')->nullable();
            $table->string('updusr')->nullable();

            // ✅ created_at & updated_at en datetime2
           $table->dateTime('created_at', 7)->nullable()->default(DB::raw('SYSUTCDATETIME()'));
           $table->dateTime('updated_at', 7)->nullable()->default(DB::raw('SYSUTCDATETIME()'));

        });
    }

    public function down()
    {
        Schema::dropIfExists('xcautions');
    }
};
