<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'notification_id',
        'type',
        'title',
        'message',
        'data',
        'from_user_id',
        'to_user_role',
        'related_operation_type',
        'related_operation_id',
        'is_read',
        'read_at',
        'priority'
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($notification) {
            if (empty($notification->notification_id)) {
                $notification->notification_id = self::generateNotificationId();
            }
        });
    }

    /**
     * Generate a unique notification ID
     */
    public static function generateNotificationId()
    {
        $lastNotification = self::orderBy('notification_id', 'desc')->first();
        if (!$lastNotification) {
            return 'NOTIF001';
        }
        $lastNumber = (int) substr($lastNotification->notification_id, 5);
        $nextNumber = $lastNumber + 1;
        return 'NOTIF' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Scope for unread notifications
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope for notifications by user role
     */
    public function scopeForRole($query, $role)
    {
        return $query->where('to_user_role', $role);
    }

    /**
     * Scope for notifications by type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead()
    {
        $this->update([
            'is_read' => true,
            'read_at' => now()
        ]);
    }

    /**
     * Get the user who sent the notification
     */
    public function fromUser()
    {
        return $this->belongsTo(User::class, 'from_user_id', 'USER_ID');
    }
}
