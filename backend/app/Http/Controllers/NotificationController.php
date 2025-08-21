<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class NotificationController extends Controller
{
    /**
     * Get notifications for the authenticated user's role
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $unreadOnly = $request->query('unread_only', false);
        $limit = $request->query('limit', 20);

        $notifications = NotificationService::getForRole(
            $user->ROLE, 
            filter_var($unreadOnly, FILTER_VALIDATE_BOOLEAN), 
            min($limit, 50) // Max 50 notifications
        );

        $counts = NotificationService::getCountsByRole($user->ROLE);

        return response()->json([
            'notifications' => $notifications,
            'counts' => $counts
        ]);
    }

    /**
     * Get notification counts for the authenticated user's role
     */
    public function getCounts(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $counts = NotificationService::getCountsByRole($user->ROLE);

        return response()->json($counts);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $notification = Notification::where('id', $id)
            ->where('to_user_role', $user->ROLE)
            ->first();

        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read']);
    }

    /**
     * Mark multiple notifications as read
     */
    public function markMultipleAsRead(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validator = Validator::make($request->all(), [
            'notification_ids' => 'required|array',
            'notification_ids.*' => 'integer|exists:notifications,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Only allow marking notifications for the current user's role
        $notifications = Notification::whereIn('id', $request->notification_ids)
            ->where('to_user_role', $user->ROLE)
            ->pluck('id')
            ->toArray();

        NotificationService::markAsRead($notifications);

        return response()->json([
            'message' => 'Notifications marked as read',
            'marked_count' => count($notifications)
        ]);
    }

    /**
     * Mark all notifications as read for the authenticated user's role
     */
    public function markAllAsRead(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $updated = Notification::where('to_user_role', $user->ROLE)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now()
            ]);

        return response()->json([
            'message' => 'All notifications marked as read',
            'updated_count' => $updated
        ]);
    }

    /**
     * Get a specific notification
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $notification = Notification::where('id', $id)
            ->where('to_user_role', $user->ROLE)
            ->with('fromUser:USER_ID,FULL_NAME,ROLE')
            ->first();

        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        // Automatically mark as read when viewed
        if (!$notification->is_read) {
            $notification->markAsRead();
        }

        return response()->json($notification);
    }

    /**
     * Delete a notification (soft delete or hard delete)
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $notification = Notification::where('id', $id)
            ->where('to_user_role', $user->ROLE)
            ->first();

        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $notification->delete();

        return response()->json(['message' => 'Notification deleted']);
    }

    /**
     * Get notifications by type for the authenticated user's role
     */
    public function getByType(Request $request, $type)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $limit = $request->query('limit', 10);

        $notifications = Notification::forRole($user->ROLE)
            ->ofType($type)
            ->orderBy('created_at', 'desc')
            ->limit(min($limit, 50))
            ->get();

        return response()->json($notifications);
    }

    /**
     * Test notification creation (for development/testing)
     */
    public function testNotification(Request $request)
    {
        if (app()->environment() !== 'local') {
            return response()->json(['message' => 'Test endpoint only available in local environment'], 403);
        }

        $validator = Validator::make($request->all(), [
            'type' => 'required|string',
            'to_user_role' => 'required|string',
            'title' => 'required|string',
            'message' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $notification = NotificationService::create([
            'type' => $request->type,
            'title' => $request->title,
            'message' => $request->message,
            'to_user_role' => $request->to_user_role,
            'related_operation_type' => 'test',
            'priority' => 'normal'
        ]);

        return response()->json([
            'message' => 'Test notification created',
            'notification' => $notification
        ]);
    }
}
