<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('Method not allowed', 405);
}

$token = bearer_token();
if ($token) {
    db()->prepare('DELETE FROM admin_tokens WHERE token = ?')->execute([$token]);
}

send(['loggedOut' => true]);
