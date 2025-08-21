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
        // Check if table already exists before creating
        if (!Schema::hasTable('csolde')) {
            Schema::create('csolde', function (Blueprint $table) {
                $table->string('codeClient', 255);
                $table->string('site', 255);
                $table->decimal('solde', 10, 2)->default(0.00);
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
                
                // Create composite primary key
                $table->primary(['codeClient', 'site']);
                
                // Add indexes for better performance
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
