<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::connection('sqlsrv')->hasTable('csolde')) {
            Schema::connection('sqlsrv')->create('csolde', function (Blueprint $table) {
                $table->string('codeClient', 255);
                $table->string('site', 255);
                $table->decimal('solde', 10, 2)->default(0.00);

                // ✅ datetime2 au lieu de timestamp pour SQL Server
                $table->dateTime('updated_at', 7)->nullable()->default(DB::raw('SYSUTCDATETIME()'));
                // ✅ clé primaire composite
                $table->primary(['codeClient', 'site']);

                // ✅ indexes
                $table->index('codeClient');
                $table->index('site');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('csolde');
    }
};
