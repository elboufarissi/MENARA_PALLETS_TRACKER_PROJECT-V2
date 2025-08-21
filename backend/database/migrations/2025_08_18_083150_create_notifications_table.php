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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('notification_id')->unique(); // Custom notification ID
            $table->string('type'); // Type of notification (caution_validated, consignation_ready, etc.)
            $table->string('title'); // Notification title
            $table->text('message'); // Notification message
            $table->json('data')->nullable(); // Additional data (client, amount, etc.)
            $table->string('from_user_id')->nullable(); // User who triggered the notification
            $table->string('to_user_role'); // Target user role (AGENT_ORDONNANCEMENT, CAISSIERE, etc.)
            $table->string('related_operation_type'); // caution, consignation, deconsignation, restitution
            $table->string('related_operation_id')->nullable(); // ID of the related operation
            $table->boolean('is_read')->default(false); // Whether the notification has been read
            $table->timestamp('read_at')->nullable(); // When the notification was read
            $table->string('priority')->default('normal'); // high, normal, low
            $table->timestamps();
            
            // Indexes for better performance
            $table->index(['to_user_role', 'is_read', 'created_at']);
            $table->index(['type', 'created_at']);
            $table->index(['related_operation_type', 'related_operation_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
