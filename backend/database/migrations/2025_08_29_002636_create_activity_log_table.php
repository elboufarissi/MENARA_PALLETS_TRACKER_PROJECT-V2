<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('sqlsrv')->create('activity_log', function (Blueprint $table) {
            $table->bigIncrements('id'); // PRIMARY

            $table->string('log_name')->nullable()->index('activity_log_log_name_index');
            $table->string('description')->nullable();

            // ✅ Use string instead of bigint (fix conversion issues)
            $table->string('subject_type')->nullable();
            $table->string('subject_id', 64)->nullable();
            $table->index(['subject_type', 'subject_id'], 'activity_log_subject_type_subject_id_index');

            $table->string('causer_type')->nullable();
            $table->string('causer_id', 64)->nullable();
            $table->index(['causer_type', 'causer_id'], 'activity_log_causer_type_causer_id_index');

            $table->string('event')->nullable()->index('activity_log_event_index');
            $table->longText('properties')->nullable();

            $table->uuid('batch_uuid')->nullable();

            // ✅ For SQL Server compatibility (no timestamp → datetime2)
           $table->dateTime('created_at', 7)->nullable()->default(DB::raw('SYSUTCDATETIME()'));
           $table->dateTime('updated_at', 7)->nullable()->default(DB::raw('SYSUTCDATETIME()'));

        });
    }

    public function down(): void
    {
        Schema::connection('sqlsrv')->dropIfExists('activity_log');
    }
};
