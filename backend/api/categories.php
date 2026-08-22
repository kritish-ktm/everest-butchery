<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = db();

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT * FROM categories ORDER BY sort_order');
    send(['categories' => $stmt->fetchAll()]);
}

fail('Method not allowed', 405);
