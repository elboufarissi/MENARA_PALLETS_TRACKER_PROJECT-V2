<?php

return [

    // Enable/disable logging
    'enabled' => (bool) env('ACTIVITY_LOGGER_ENABLED', true),

    // Days to keep records (integer, in DAYS — not seconds)
    'delete_records_older_than_days' => (int) env('ACTIVITY_LOGGER_DELETE_DAYS', 365),

    // Default log channel name when none provided
    'default_log_name' => env('ACTIVITY_LOGGER_DEFAULT_LOG_NAME', 'default'),

    // Auth driver (null = use Laravel default)
    // was: 'default_auth_driver' => null,
'default_auth_driver' => 'api',


    // Whether subject() returns soft-deleted models
    'subject_returns_soft_deleted_models' => false,

    // Model class for activities
    'activity_model' => \Spatie\Activitylog\Models\Activity::class,

    // Table & connection for the activity log
    'table_name' => env('ACTIVITY_LOGGER_TABLE_NAME', 'activity_log'),

    // IMPORTANT: force to a real connection name (e.g., "mysql", "sqlsrv").
    // Default to mysql so it doesn't accidentally use sqlsrv as the app default.
    'database_connection' => env('ACTIVITY_LOGGER_DB_CONNECTION', 'mysql'),
];
