<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('Method not allowed', 405);
}

// Only a logged-in admin can upload product images.
require_admin();

if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    $err = $_FILES['image']['error'] ?? 'no file received';
    fail('Image upload failed (' . $err . ')');
}

$file = $_FILES['image'];

// 5MB cap - product photos don't need to be bigger than this.
$maxBytes = 5 * 1024 * 1024;
if ($file['size'] > $maxBytes) {
    fail('Image is too large (max 5MB)');
}

// Validate the actual file content, not just the filename/extension -
// getimagesize() fails on anything that isn't really an image.
$info = @getimagesize($file['tmp_name']);
if ($info === false) {
    fail('File is not a valid image');
}

$allowed = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
];
$mime = $info['mime'];
if (!isset($allowed[$mime])) {
    fail('Only JPG, PNG, WEBP or GIF images are allowed');
}

$ext = $allowed[$mime];
$filename = bin2hex(random_bytes(16)) . '.' . $ext; // random name - never trust the original filename
$destDir = __DIR__ . '/../uploads/products';
if (!is_dir($destDir)) {
    mkdir($destDir, 0755, true);
}
$destPath = $destDir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    fail('Could not save the uploaded image', 500);
}

// Relative path stored in the DB and returned to the frontend, which
// resolves it against the backend's base URL (see frontend/src/lib/imageUrl.js).
send(['path' => 'uploads/products/' . $filename], 201);
