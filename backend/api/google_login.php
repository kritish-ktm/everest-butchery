<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('Method not allowed', 405);
}

$data = json_input();
$credential = trim((string)($data['credential'] ?? ''));
if (!$credential) {
    fail('Google credential is required');
}

$identity = google_identity_from_token($credential);
if (!$identity) {
    if (!GOOGLE_CLIENT_ID) {
        fail('Google Sign-In is not configured on this server', 503);
    }
    fail('Google identity could not be validated', 401);
}

send([
    'verified' => true,
    'user' => $identity,
]);