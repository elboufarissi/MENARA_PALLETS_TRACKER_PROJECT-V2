<?php
$host = getenv('DB_HOST');
$port = getenv('DB_PORT');
$database = getenv('DB_DATABASE');
$username = getenv('DB_USERNAME');
$password = getenv('DB_PASSWORD');

// Check if the environment variables are set
if (!$host || !$port || !$database || !$username || !$password) {
    die("Database connection details are not set in the environment variables.\n");
}

// Attempt to connect to the database using PDO
try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$database", $username, $password, [
        PDO::ATTR_TIMEOUT => 5,
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "Connected successfully\n";
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
}

// try {
//     $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=pt_db_menara_ma', 'root', '', [
//         PDO::ATTR_TIMEOUT => 5,
//         PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
//     ]);
//     echo "Connected successfully\n";
// } catch (PDOException $e) {
//     echo "Connection failed: " . $e->getMessage() . "\n";
// }
