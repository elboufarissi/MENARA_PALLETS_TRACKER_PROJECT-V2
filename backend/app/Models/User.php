<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property string $USER_ID
 * @property string $FULL_NAME
 * @property string $ROLE
 * @property string $USERNAME
 * @property string $password
 * @property string $api_token
 * @property \DateTime $DATE_CREATION
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'USER_ID';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The data type of the auto-incrementing ID.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'FULL_NAME',
        'ROLE',
        'USERNAME',
        'password',
        'api_token',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'api_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'DATE_CREATION' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Boot the model and add event listeners.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            // USER_ID auto-generation
            if (empty($user->USER_ID)) {
                $user->USER_ID = self::generateUserId();
            }
            // USERNAME auto-fill
            if (empty($user->USERNAME) && !empty($user->FULL_NAME)) {
                $user->USERNAME = self::generateUsername($user->FULL_NAME);
            }
        });
    }

    /**
     * Generate a unique user ID in the format U001, U002, etc.
     *
     * @return string
     */
    public static function generateUserId()
    {
        $lastUser = self::orderBy('USER_ID', 'desc')->first();
        if (!$lastUser) {
            return 'U001';
        }
        $lastNumber = (int) substr($lastUser->USER_ID, 1);
        $nextNumber = $lastNumber + 1;
        return 'U' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Generate a username from full name: first letter of first name + last name (lowercase)
     * @param string $fullName
     * @return string
     */
    public static function generateUsername($fullName)
    {
        $parts = preg_split('/\s+/', trim($fullName));
        if (count($parts) < 2) {
            return strtolower($fullName); // fallback if only one name
        }
        $first = strtolower(substr($parts[0], 0, 1));
        $last = strtolower($parts[count($parts) - 1]);
        return $first . $last;
    }
}
