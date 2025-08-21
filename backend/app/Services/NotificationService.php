<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Create and send a notification
     */
    public static function create(array $data)
    {
        try {
            $notification = Notification::create([
                'type' => $data['type'],
                'title' => $data['title'],
                'message' => $data['message'],
                'data' => $data['data'] ?? null,
                'from_user_id' => $data['from_user_id'] ?? null,
                'to_user_role' => $data['to_user_role'],
                'related_operation_type' => $data['related_operation_type'],
                'related_operation_id' => $data['related_operation_id'] ?? null,
                'priority' => $data['priority'] ?? 'normal'
            ]);

            Log::info("Notification created: {$notification->notification_id} for role {$data['to_user_role']}");
            
            return $notification;
        } catch (\Exception $e) {
            Log::error("Failed to create notification: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Send notification when caution is validated
     */
    public static function cautionValidated($caution, $fromUserId = null)
    {
        // Get client name from BpCustomer model
        $clientName = $caution->xraison_0; // client name (raison sociale)
        Log::info("NotificationService: Looking up client {$caution->xraison_0}");
        
        try {
            $client = \App\Models\BpCustomer::where('bpcnum_0', $caution->xclient_0)->first();
            if ($client && $client->bpcnam_0) {
                $clientName = $client->bpcnam_0; // Use raison sociale
                Log::info("NotificationService: Found client name: {$clientName}");
            } else {
                Log::warning("NotificationService: Client not found or no name for {$caution->xclient_0}");
            }
        } catch (\Exception $e) {
            Log::warning("Could not fetch client name for {$caution->xclient_0}: " . $e->getMessage());
        }
        
        $message = "Mr {$clientName} vient de déposer une caution de {$caution->montant} DH, il est en route pour faire une consignation";
        Log::info("NotificationService: Creating notification with message: {$message}");
        
        return self::create([
            'type' => 'caution_validated',
            'title' => 'Nouvelle caution validée',
            'message' => $message,
            'data' => [
                'client_code' => $caution->xclient_0,
                'client_name' => $clientName,
                'site_code' => $caution->xsite_0,
                'montant' => $caution->montant,
                'nombre_palettes' => intval($caution->montant / 100),
                'caution_id' => $caution->xnum_0
            ],
            'from_user_id' => $fromUserId,
            'to_user_role' => 'AGENT_ORDONNANCEMENT',
            'related_operation_type' => 'caution',
            'related_operation_id' => $caution->xnum_0,
            'priority' => 'high'
        ]);
    }

    /**
     * Send notification when deconsignation is created by AGENT_ORDONNANCEMENT (Step 1)
     */
    public static function deconsignationCreatedByAgent($deconsignation, $fromUserId = null)
    {
        // Use xraison_0 which contains the client name directly
        $clientName = $deconsignation->xraison_0 ?: $deconsignation->xclient_0; // Fallback to client code if raison_0 is empty
        
        return self::create([
            'type' => 'deconsignation_agent_created',
            'title' => 'Nouvelle demande de déconsignation',
            'message' => "Mr {$clientName} vient de demander une déconsignation, Merci de bien vouloir renseigner les palettes conformes",
            'data' => [
                'client_code' => $deconsignation->xclient_0,
                'client_name' => $clientName,
                'site_code' => $deconsignation->xsite_0,
                'palette_a_deconsigner' => $deconsignation->palette_a_deconsigner,
                'deconsignation_id' => $deconsignation->xnum_0
            ],
            'from_user_id' => $fromUserId,
            'to_user_role' => 'CHEF_PARC',
            'related_operation_type' => 'deconsignation',
            'related_operation_id' => $deconsignation->xnum_0,
            'priority' => 'normal'
        ]);
    }

    /**
     * Send notification when CHEF_PARC fills conforming pallets (Step 2)
     */
    public static function deconsignationPalettesFilledByChef($deconsignation, $fromUserId = null)
    {
        // Create notification for CAISSIERE
        $notificationCaissiere = self::create([
            'type' => 'deconsignation_chef_filled',
            'title' => 'Déconsignation en attente de validation',
            'message' => "Déconsignation numéro {$deconsignation->xnum_0} pour Mr. {$deconsignation->xraison_0} en attente de validation",
            'data' => [
                'client_code' => $deconsignation->xclient_0,
                'site_code' => $deconsignation->xsite_0,
                'palette_deconsignees' => $deconsignation->palette_deconsignees,
                'deconsignation_id' => $deconsignation->xnum_0
            ],
            'from_user_id' => $fromUserId,
            'to_user_role' => 'CAISSIERE',
            'related_operation_type' => 'deconsignation',
            'related_operation_id' => $deconsignation->xnum_0,
            'priority' => 'normal'
        ]);

        // Create notification for CAISSIER
        $notificationCaissier = self::create([
            'type' => 'deconsignation_chef_filled',
            'title' => 'Déconsignation en attente de validation',
            'message' => "Déconsignation numéro {$deconsignation->xnum_0} en attente de validation",
            'data' => [
                'client_code' => $deconsignation->xclient_0,
                'site_code' => $deconsignation->xsite_0,
                'palette_deconsignees' => $deconsignation->palette_deconsignees,
                'deconsignation_id' => $deconsignation->xnum_0
            ],
            'from_user_id' => $fromUserId,
            'to_user_role' => 'CAISSIER',
            'related_operation_type' => 'deconsignation',
            'related_operation_id' => $deconsignation->xnum_0,
            'priority' => 'normal'
        ]);

        return $notificationCaissiere; // Return one of them
    }

    /**
     * Send notification when deconsignation is created (pending validation) - LEGACY METHOD
     */
    public static function deconsignationCreated($deconsignation, $fromUserId = null)
    {
        // This is the legacy method - keeping for backward compatibility
        // Use xraison_0 which contains the client name directly
        $clientName = $deconsignation->xraison_0 ?: $deconsignation->xclient_0; // Fallback to client code if raison_0 is empty
        
        return self::create([
            'type' => 'deconsignation_pending',
            'title' => 'Nouvelle demande de déconsignation',
            'message' => "Demande de déconsignation de {$deconsignation->palette_a_deconsigner} palettes pour {$clientName} en attente de validation",
            'data' => [
                'client_code' => $deconsignation->xclient_0,
                'client_name' => $clientName,
                'site_code' => $deconsignation->xsite_0,
                'palette_a_deconsigner' => $deconsignation->palette_a_deconsigner,
                'deconsignation_id' => $deconsignation->xnum_0
            ],
            'from_user_id' => $fromUserId,
            'to_user_role' => 'CAISSIERE',
            'related_operation_type' => 'deconsignation',
            'related_operation_id' => $deconsignation->xnum_0,
            'priority' => 'normal'
        ]);
    }

    /**
     * Send notification when deconsignation is validated
     */
    public static function deconsignationValidated($deconsignation, $fromUserId = null)
    {
        // Use xraison_0 which contains the client name directly
        $clientName = $deconsignation->xraison_0 ?: $deconsignation->xclient_0; // Fallback to client code if raison_0 is empty
        
        return self::create([
            'type' => 'deconsignation_validated',
            'title' => 'Déconsignation validée',
            'message' => "Déconsignation de {$deconsignation->palette_deconsignees} palettes pour {$clientName} a été validée",
            'data' => [
                'client_code' => $deconsignation->xclient_0,
                'client_name' => $clientName,
                'site_code' => $deconsignation->xsite_0,
                'palettes_deconsignees' => $deconsignation->palette_deconsignees,
                'deconsignation_id' => $deconsignation->xnum_0
            ],
            'from_user_id' => $fromUserId,
            'to_user_role' => 'AGENT_ORDONNANCEMENT',
            'related_operation_type' => 'deconsignation',
            'related_operation_id' => $deconsignation->xnum_0,
            'priority' => 'normal'
        ]);
    }

    /**
     * Get notifications for a specific user role
     */
    public static function getForRole($role, $unreadOnly = false, $limit = 10)
    {
        $query = Notification::forRole($role)
            ->orderBy('created_at', 'desc')
            ->limit($limit);

        if ($unreadOnly) {
            $query->unread();
        }

        return $query->get();
    }

    /**
     * Mark multiple notifications as read
     */
    public static function markAsRead($notificationIds)
    {
        return Notification::whereIn('id', $notificationIds)
            ->update([
                'is_read' => true,
                'read_at' => now()
            ]);
    }

    /**
     * Get notification counts by role
     */
    public static function getCountsByRole($role)
    {
        $total = Notification::forRole($role)->count();
        $unread = Notification::forRole($role)->unread()->count();
        
        return [
            'total' => $total,
            'unread' => $unread,
            'read' => $total - $unread
        ];
    }

    /**
     * Clean old notifications (older than specified days)
     */
    public static function cleanOldNotifications($daysOld = 30)
    {
        $cutoffDate = now()->subDays($daysOld);
        
        $deleted = Notification::where('created_at', '<', $cutoffDate)
            ->where('is_read', true)
            ->delete();
            
        Log::info("Cleaned {$deleted} old notifications older than {$daysOld} days");
        
        return $deleted;
    }
}