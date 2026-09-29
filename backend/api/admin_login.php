<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('Method not allowed', 405);
}

$data = json_input();
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$email || !$password) {
    fail('Email and password are required');
}

$pdo = db();
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? AND role = "admin"');
$stmt->execute([$email]);
$user = $stmt->fetch();

// Same generic error whether the email doesn't exist or the password is
// wrong - don't tell attackers which one it was.
if (!$user || !password_verify($password, $user['password_hash'])) {
    fail('Invalid email or password', 401);
}

// Issue a fresh token, valid for 7 days.
$token = bin2hex(random_bytes(32));
$expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

$insert = $pdo->prepare('INSERT INTO admin_tokens (user_id, token, expires_at) VALUES (?, ?, ?)');
$insert->execute([$user['id'], $token, $expiresAt]);

// Housekeeping: clear this user's old expired tokens.
$pdo->prepare('DELETE FROM admin_tokens WHERE user_id = ? AND expires_at <= NOW()')->execute([$user['id']]);

send([
    'token' => $token,
    'expires_at' => $expiresAt,
    'user' => [
        'id' => $user['id'],
        'full_name' => $user['full_name'],
        'email' => $user['email'],
        'role' => $user['role'],
    ],
]);
